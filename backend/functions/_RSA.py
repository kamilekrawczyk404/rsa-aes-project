import random
import sys
import time
import hashlib
import os

# Zwiększamy limit konwersji dla dużych liczb
try:
    sys.set_int_max_str_digits(10000)
except AttributeError:
    pass

# ==========================================
# MATEMATYKA RSA (CORE) - bez zmian
# ==========================================

def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a

def is_prime_miller_rabin(n, k=40):
    if n == 2 or n == 3: return True
    if n % 2 == 0 or n < 2: return False
    r, d = 0, n - 1
    while d % 2 == 0:
        r += 1
        d //= 2
    for _ in range(k):
        a = random.randrange(2, n - 1)
        x = pow(a, d, n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True

def get_prime(n_bits):
    while True:
        p = random.getrandbits(n_bits)
        p |= (1 << n_bits - 1) | 1
        if is_prime_miller_rabin(p):
            return p

def generate_keypair(keysize):
    print(f"Generowanie kluczy RSA ({keysize} bitów)...")
    start = time.time()
    e = 65537
    while True:
        p = get_prime(keysize // 2)
        q = get_prime(keysize // 2)
        if p == q: continue
        n = p * q
        phi = (p - 1) * (q - 1)
        if gcd(e, phi) == 1:
            try:
                d = pow(e, -1, phi)
                break
            except ValueError:
                continue
    print(f"Gotowe w {time.time() - start:.2f}s.")
    return ((e, n), (d, n))

# ==========================================
# NOWY PADDING: OAEP (SHA-256)
# ==========================================

def xor_bytes(a, b):
    """Pomocnicza funkcja XORująca dwa ciągi bajtów."""
    return bytes(x ^ y for x, y in zip(a, b))

def mgf1(seed, mask_len, hash_func=hashlib.sha256):
    """Mask Generation Function (MGF1) - standardowy generator maski."""
    h_len = hash_func().digest_size
    mask = b""
    counter = 0
    while len(mask) < mask_len:
        # Licznik jako 4 bajty big-endian
        C = counter.to_bytes(4, 'big')
        mask += hash_func(seed + C).digest()
        counter += 1
    return mask[:mask_len]

def oaep_pad(message, target_block_len, label=b"", hash_func=hashlib.sha256):
    """Implementacja paddingu OAEP (enkapsulacja)."""
    h_len = hash_func().digest_size
    
    # Maksymalna długość wiadomości w OAEP to: długość_bloku - 2*długość_hasha - 2
    max_msg_len = target_block_len - 2 * h_len - 2
    
    if len(message) > max_msg_len:
         # W praktyce ten błąd nie powinien wystąpić, bo w funkcji encrypt
         # dzielimy wiadomość na odpowiednie kawałki.
        raise ValueError("Wiadomość za długa dla tego bloku OAEP.")

    # 1. Przygotowanie lHash (hash etykiety, zwykle pustej)
    l_hash = hash_func(label).digest()
    
    # 2. Generowanie paddingu zerami (PS)
    ps_len = target_block_len - len(message) - 2 * h_len - 2
    ps = b'\x00' * ps_len
    
    # 3. Tworzenie bloku danych (DB = lHash || PS || 0x01 || M)
    db = l_hash + ps + b'\x01' + message
    
    # 4. Generowanie losowego ziarna (seed)
    seed = os.urandom(h_len)
    
    # 5. Maskowanie DB (maskedDB = DB XOR MGF1(seed))
    db_mask = mgf1(seed, target_block_len - h_len - 1, hash_func)
    masked_db = xor_bytes(db, db_mask)
    
    # 6. Maskowanie ziarna (maskedSeed = seed XOR MGF1(maskedDB))
    seed_mask = mgf1(masked_db, h_len, hash_func)
    masked_seed = xor_bytes(seed, seed_mask)
    
    # 7. Wynikowy blok (0x00 || maskedSeed || maskedDB)
    # Początkowy bajt 0x00 zapewnia, że liczba powstała z bajtów jest mniejsza niż N.
    return b'\x00' + masked_seed + masked_db

def oaep_unpad(padded_block, target_block_len, label=b"", hash_func=hashlib.sha256):
    """Implementacja usuwania paddingu OAEP (dekapsulacja)."""
    h_len = hash_func().digest_size
    
    # Sprawdzenie długości i wiodącego bajtu 0x00
    if len(padded_block) != target_block_len or padded_block[0] != 0:
        raise ValueError("Błąd dekodowania OAEP.")

    # Rozdzielenie maskedSeed i maskedDB
    masked_seed = padded_block[1:1 + h_len]
    masked_db = padded_block[1 + h_len:]
    
    # Odzyskanie seeda
    seed_mask = mgf1(masked_db, h_len, hash_func)
    seed = xor_bytes(masked_seed, seed_mask)
    
    # Odzyskanie DB
    db_mask = mgf1(seed, target_block_len - h_len - 1, hash_func)
    db = xor_bytes(masked_db, db_mask)
    
    # Weryfikacja lHash
    l_hash = hash_func(label).digest()
    if not db.startswith(l_hash):
         raise ValueError("Błąd dekodowania OAEP (nieprawidłowy lHash).")
         
    # Znalezienie separatora 0x01
    try:
        separator_idx = db.find(b'\x01', len(l_hash))
        if separator_idx == -1:
             raise ValueError("Brak separatora 0x01.")
    except Exception:
         raise ValueError("Błąd struktury OAEP.")
         
    # Zwrócenie właściwej wiadomości
    return db[separator_idx + 1:]

# ==========================================
# SZYFROWANIE / ODSZYFROWYWANIE (z OAEP)
# ==========================================

def encrypt(message_bytes, public_key):
    e, n = public_key
    # Całkowity rozmiar bloku w bajtach (np. 512 dla RSA-4096)
    key_bytes_len = (n.bit_length() + 7) // 8
    
    # Długość hasha SHA-256
    h_len = 32 
    # Maksymalna ilość czystych danych, które zmieszczą się w jednym bloku OAEP
    max_chunk_size = key_bytes_len - 2 * h_len - 2
    
    if max_chunk_size <= 0:
        raise ValueError("Klucz RSA jest zbyt mały, by użyć OAEP z SHA-256.")

    encrypted_blocks = []
    
    # Dzielimy wiadomość na kawałki odpowiednie dla OAEP
    for i in range(0, len(message_bytes), max_chunk_size):
        chunk = message_bytes[i:i+max_chunk_size]
        
        # 1. Zastosowanie paddingu OAEP
        padded_chunk = oaep_pad(chunk, key_bytes_len)
        
        # 2. Matematyka RSA
        int_val = int.from_bytes(padded_chunk, 'big')
        cipher_int = pow(int_val, e, n)
        
        # 3. Konwersja wyniku na bajty o stałej długości bloku
        cipher_bytes = cipher_int.to_bytes(key_bytes_len, 'big')
        encrypted_blocks.append(cipher_bytes)
        
    return b"".join(encrypted_blocks)

def decrypt(ciphertext_bytes, private_key):
    d, n = private_key
    key_bytes_len = (n.bit_length() + 7) // 8
    
    decrypted_stream = b""
    
    # Iterujemy po zaszyfrowanych blokach
    for i in range(0, len(ciphertext_bytes), key_bytes_len):
        block = ciphertext_bytes[i:i+key_bytes_len]
        
        if len(block) != key_bytes_len:
             raise ValueError("Uszkodzony szyfrogram (niepełny blok).")

        # 1. Matematyka RSA
        int_val = int.from_bytes(block, 'big')
        plain_int = pow(int_val, d, n)
        
        # 2. Konwersja na bajty. BARDZO WAŻNE:
        # Wynik musi mieć DOKŁADNIE długość key_bytes_len.
        # Jeśli liczba jest mniejsza, uzupełniamy zerami z lewej strony.
        padded_block = plain_int.to_bytes(key_bytes_len, 'big')

        # 3. Zdjęcie paddingu OAEP
        try:
            chunk = oaep_unpad(padded_block, key_bytes_len)
            decrypted_stream += chunk
        except ValueError:
            # Jeśli OAEP się nie zgadza (np. zły klucz), zgłaszamy błąd
            raise ValueError("Błąd weryfikacji OAEP - prawdopodobnie zły klucz prywatny.")

    return decrypted_stream

# ==========================================
# TEST
# ==========================================

if __name__ == "__main__":
    print("--- TESTOWANIE RSA Z PADDINGIEM OAEP (SHA-256) ---\n")

    # 1. Generujemy duży klucz (4096 bitów)
    # Teraz to zadziała, bo OAEP obsługuje bloki 512-bajtowe.
    KEY_SIZE = 4096
    pub, priv = generate_keypair(KEY_SIZE)

    block_size = (pub[1].bit_length() + 7) // 8
    print(f"Rozmiar bloku RSA: {block_size} bajtów.")
    # Obliczamy ile realnych danych wejdzie do jednego bloku przy OAEP SHA-256
    max_oaep_data = block_size - 2*32 - 2
    print(f"Maksymalna ilość danych w jednym bloku OAEP: {max_oaep_data} bajtów.\n")

    # 2. Dane testowe (dłuższe niż jeden blok)
    long_text = "W Szczebrzeszynie chrząszcz brzmi w trzcinie. " * 15
    original_data = long_text.encode('utf-8')
    
    print(f"Dane wejściowe: {len(original_data)} bajtów (zostaną podzielone na bloki).")

    # 3. Szyfrowanie
    print("Szyfrowanie z OAEP...")
    try:
        enc = encrypt(original_data, pub)
        print(f"Zaszyfrowano. Rozmiar szyfrogramu: {len(enc)} bajtów.")
    except Exception as e:
        print(f"Błąd szyfrowania: {e}")
        sys.exit()

    # 4. Odszyfrowanie
    print("\nDeszyfrowanie z weryfikacją OAEP...")
    try:
        dec = decrypt(enc, priv)
        
        # 5. Weryfikacja
        if original_data == dec:
            print("\n>>> SUKCES! Wiadomość odszyfrowana poprawnie. <<<")
            print(f"Fragment treści: {dec.decode('utf-8')[:100]}...")
        else:
             print("\n>>> BŁĄD: Dane się różnią po odszyfrowaniu! <<<")

    except ValueError as e:
        print(f"\nBŁĄD DESZYFROWANIA (oczekiwany przy złym kluczu): {e}")

    # 6. Test negatywny (zły klucz)
    print("\n--- Test złego klucza prywatnego ---")
    fake_priv = (priv[0] - 2, priv[1]) # Lekko zmienione 'd'
    try:
        decrypt(enc, fake_priv)
        print("BŁĄD KRYTYCZNY: OAEP przepuścił zły klucz!")
    except ValueError as e:
        print(f"Prawidłowe zachowanie (OAEP wykrył błąd): {e}")