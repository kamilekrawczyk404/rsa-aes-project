import _mainAES

# --- Funkcje pomocnicze do operacji bitowych i konwersji ---

def bytes_to_int(b):
    return int.from_bytes(b, 'big')

def int_to_bytes(i, length=16):
    return i.to_bytes(length, 'big')

def list_to_bytes(l):
    return bytes(l)

def list_to_int(l):
    return bytes_to_int(list_to_bytes(l))

def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))

# --- Arytmetyka w ciele Galois GF(2^128) dla GCM ---

def gf_mult(x, y):
    """
    Mnożenie dwóch 128-bitowych liczb całkowitych w ciele GF(2^128)
    z wielomianem redukcyjnym x^128 + x^7 + x^2 + x + 1.
    Jest to uproszczona implementacja (tzw. "right-to-left comb" bez tablic lookup).
    """
    R = 0xE1000000000000000000000000000000
    z = 0
    v = x
    for i in range(128):
        if (y >> (127 - i)) & 1:
            z ^= v
        if v & 1:
            v = (v >> 1) ^ R
        else:
            v >>= 1
    return z

def ghash(h, data):
    """
    Funkcja GHASH obliczająca tag uwierzytelniający.
    h: klucz haszujący (int)
    data: dane do przetworzenia (bytes)
    """
    y = 0
    # Dopełniamy dane zerami do wielokrotności 16 bajtów, jeśli trzeba
    if len(data) % 16 != 0:
        data += bytes(16 - (len(data) % 16))
    
    for i in range(0, len(data), 16):
        block = bytes_to_int(data[i:i+16])
        y ^= block
        y = gf_mult(y, h)
    return y

# --- Główna implementacja AES-GCM ---

def AES_GCM_encrypt(plaintext, key, iv, aad=b''):
    """
    plaintext: string
    key: int (128 bit)
    iv: bytes (zalecane 12 bajtów / 96 bitów)
    aad: bytes (opcjonalne dane uwierzytelniające)
    """
    # 1. Przygotowanie danych
    if isinstance(plaintext, str):
        plaintext_bytes = plaintext.encode('utf-8')
    else:
        plaintext_bytes = plaintext

    # --- POPRAWKA TUTAJ ---
    # Wrapper na _mainAES, który naprawia format danych wyjściowych
    def encrypt_block_to_int(input_bytes, key_int):
        raw_output = _mainAES.main(input_bytes, key_int)
        
        flat_list = []
        
        # SPRAWDZENIE STRUKTURY DANYCH
        is_matrix = isinstance(raw_output, list) and len(raw_output) == 4 and isinstance(raw_output[0], list)
        
        if is_matrix:
            # --- POPRAWKA: TRANSPOZYCJA (Czytanie kolumnami) ---
            # Standard AES FIPS 197: Bajty w macierzy State ułożone są kolumnami.
            # Musimy zamienić output[wiersz][kolumna] -> strumień bajtów
            for col in range(4):
                for row in range(4):
                    val = raw_output[row][col]
                    flat_list.append(val)
        else:
            # Jeśli _mainAES zwraca płaską listę, bierzemy jak jest
            flat_list = raw_output

        # Konwersja hex string -> int
        final_list = []
        for x in flat_list:
            if isinstance(x, str):
                final_list.append(int(x, 16))
            else:
                final_list.append(x)
                
        return list_to_int(final_list)
    # ----------------------

    # 2. Obliczenie klucza haszującego H = E(K, 0^128)
    h_int = encrypt_block_to_int(bytes(16), key)

    # 3. Przygotowanie bloku licznika początkowego (J0)
    if len(iv) == 12:
        j0_int = bytes_to_int(iv + b'\x00\x00\x00\x01')
    else:
        raise ValueError("W tym przykładzie IV musi mieć 12 bajtów (96 bitów).")

    # 4. GCTR - Szyfrowanie (Counter Mode)
    ciphertext = bytearray()
    counter = j0_int
    
    num_blocks = (len(plaintext_bytes) + 15) // 16 

    for i in range(num_blocks):
        # Inkrementacja licznika (tylko 32 bity)
        high_96 = counter >> 32
        low_32 = counter & 0xFFFFFFFF
        low_32 = (low_32 + 1) & 0xFFFFFFFF
        counter = (high_96 << 32) | low_32
        
        # Szyfrujemy licznik
        encrypted_counter = encrypt_block_to_int(int_to_bytes(counter), key)
        
        # Pobieramy fragment plaintextu
        chunk = plaintext_bytes[i*16 : (i+1) * 16]
        
        # XOR
        enc_counter_bytes = int_to_bytes(encrypted_counter)
        chunk_cipher = xor_bytes(chunk, enc_counter_bytes[:len(chunk)])
        
        ciphertext.extend(chunk_cipher)

    # 5. Obliczanie Tagu Uwierzytelniającego (Auth Tag)
    len_aad_bits = len(aad) * 8
    len_c_bits = len(ciphertext) * 8
    
    ghash_input = bytearray(aad)
    if len(aad) % 16 != 0:
        ghash_input.extend(bytes(16 - (len(aad) % 16)))
        
    ghash_input.extend(ciphertext)
    if len(ciphertext) % 16 != 0:
        ghash_input.extend(bytes(16 - (len(ciphertext) % 16)))
        
    ghash_input.extend(len_aad_bits.to_bytes(8, 'big'))
    ghash_input.extend(len_c_bits.to_bytes(8, 'big'))
    
    s_tag = ghash(h_int, ghash_input)
    
    # Generujemy maskę taga szyfrując J0
    tag_mask = encrypt_block_to_int(int_to_bytes(j0_int), key)
    
    tag = s_tag ^ tag_mask
    
    return bytes(ciphertext), int_to_bytes(tag)
# --- Użycie ---

key = 0x3f7a9c12b4e6d09f5a2c7e8b1d4f6032
iv = bytes([0xca, 0xfe, 0xba, 0xbe, 0xfa, 0xce, 0xdb, 0xad, 0xde, 0xca, 0xf8, 0x88]) # 12 bajtów
aad = b"DaneNaglowka" # Opcjonalne dane, np. nagłówek pakietu sieciowego

cipher_text, tag = AES_GCM_encrypt("Hello, World!", key, iv, aad)

print("\n--- AES GCM ---")
print(f"Ciphertext (hex): {cipher_text.hex()}")
print(f"Auth Tag (hex):   {tag.hex()}")