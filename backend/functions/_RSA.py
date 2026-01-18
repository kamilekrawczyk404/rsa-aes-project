import random
import sys
import time
import hashlib
import os

# potrzebny większy limit konwersji string-> int
try:
    sys.set_int_max_str_digits(10000)
except AttributeError:
    pass

# matematyka do RSA

def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a

def is_prime_miller_rabin(n, k=40): # test czy liczba jest pierwsza (nie daje 100% pewności)
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
    start = time.time()
    e = 65537 # standardowa wartość e
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

def xor_bytes(a, b):
    # Zwraca wynik XOR dwóch bajtów o tej samej długości
    return bytes(x ^ y for x, y in zip(a, b))

def mgf1(seed, mask_len, hash_func=hashlib.sha256):
    h_len = hash_func().digest_size
    mask = b""
    counter = 0
    while len(mask) < mask_len:
        C = counter.to_bytes(4, 'big')
        mask += hash_func(seed + C).digest()
        counter += 1
    return mask[:mask_len]

def oaep_pad(message, target_block_len, label=b"", hash_func=hashlib.sha256):
    h_len = hash_func().digest_size
    max_msg_len = target_block_len - 2 * h_len - 2
    
    if len(message) > max_msg_len:
        raise ValueError("Wiadomość za długa dla tego bloku OAEP.")

    l_hash = hash_func(label).digest()
    
    ps_len = target_block_len - len(message) - 2 * h_len - 2
    ps = b'\x00' * ps_len
    
    db = l_hash + ps + b'\x01' + message
    
    seed = os.urandom(h_len)
    
    db_mask = mgf1(seed, target_block_len - h_len - 1, hash_func)
    masked_db = xor_bytes(db, db_mask)
    
    seed_mask = mgf1(masked_db, h_len, hash_func)
    masked_seed = xor_bytes(seed, seed_mask)
    
    return b'\x00' + masked_seed + masked_db

def oaep_unpad(padded_block, target_block_len, label=b"", hash_func=hashlib.sha256):
    h_len = hash_func().digest_size
    
    if len(padded_block) != target_block_len or padded_block[0] != 0:
        raise ValueError("Błąd dekodowania OAEP.")

    masked_seed = padded_block[1:1 + h_len]
    masked_db = padded_block[1 + h_len:]
    
    seed_mask = mgf1(masked_db, h_len, hash_func)
    seed = xor_bytes(masked_seed, seed_mask)
    
    db_mask = mgf1(seed, target_block_len - h_len - 1, hash_func)
    db = xor_bytes(masked_db, db_mask)
    
    l_hash = hash_func(label).digest()
    if not db.startswith(l_hash):
         raise ValueError("Błąd dekodowania OAEP (nieprawidłowy lHash).")
         
    try:
        separator_idx = db.find(b'\x01', len(l_hash))
        if separator_idx == -1:
             raise ValueError("Brak separatora 0x01.")
    except Exception:
         raise ValueError("Błąd struktury OAEP.")
         
    return db[separator_idx + 1:]

def encrypt(message_bytes, public_key):
    e, n = public_key
    key_bytes_len = (n.bit_length() + 7) // 8
    
    h_len = 32 
    max_chunk_size = key_bytes_len - 2 * h_len - 2
    
    if max_chunk_size <= 0:
        raise ValueError("Klucz RSA jest zbyt mały, by użyć OAEP z SHA-256.")

    encrypted_blocks = []
    
    for i in range(0, len(message_bytes), max_chunk_size):
        chunk = message_bytes[i:i+max_chunk_size]
        
        padded_chunk = oaep_pad(chunk, key_bytes_len)
        
        int_val = int.from_bytes(padded_chunk, 'big')
        cipher_int = pow(int_val, e, n)
        
        cipher_bytes = cipher_int.to_bytes(key_bytes_len, 'big')
        encrypted_blocks.append(cipher_bytes)
        
    return b"".join(encrypted_blocks)

def decrypt(ciphertext_bytes, private_key):
    d, n = private_key
    key_bytes_len = (n.bit_length() + 7) // 8
    
    decrypted_stream = b""
    
    for i in range(0, len(ciphertext_bytes), key_bytes_len):
        block = ciphertext_bytes[i:i+key_bytes_len]
        
        if len(block) != key_bytes_len:
             raise ValueError("Uszkodzony szyfrogram (niepełny blok).")

        int_val = int.from_bytes(block, 'big')
        plain_int = pow(int_val, d, n)
        padded_block = plain_int.to_bytes(key_bytes_len, 'big')

        try:
            chunk = oaep_unpad(padded_block, key_bytes_len)
            decrypted_stream += chunk
        except ValueError:
            raise ValueError("Błąd weryfikacji OAEP - prawdopodobnie zły klucz prywatny.")

    return decrypted_stream

def main_input(inputText, keysize):
    inputText = inputText.encode('utf-8')
    KEY_SIZE = keysize
    pub, priv = generate_keypair(KEY_SIZE)

    long_text = inputText
    original_data = long_text

    try:
        return encrypt(original_data, pub)
    except Exception as e:
        print(f"Błąd szyfrowania: {e}")
        sys.exit()