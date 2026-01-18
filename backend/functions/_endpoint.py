import _AES_ECB
import _AES_GCM
import _RSA
def what_to_run(input_data, key_length, mode):
    if mode == 'AES_ECB':
        return _AES_ECB.AES_ECB_encrypt(input_data, key_length)
    elif mode == 'AES_GCM':
        return _AES_GCM.AES_GCM_encrypt(input_data, key_length)
    elif mode == 'RSA_encrypt':
        return _RSA.main_input(input_data, key_length)
    else:
        raise ValueError("Nieznany tryb działania.")
    


#przykład użycia:

# AES ECB
# wynik, klucz = what_to_run(string_wejsciowy, wielkosc_klucza, 'AES_ECB')
result_aes_ecb, key = what_to_run("Hello, World!", 128, 'AES_ECB')
print("Wynik AES ECB:", result_aes_ecb.hex(), "Klucz:", key)
print("\n")

# AES GCM
# wynik, tag, klucz, iv = what_to_run(string_wejsciowy, wielkosc_klucza, 'AES_GCM')
result_aes_gcm, tag, key, iv = what_to_run("Hello, World!", 256, 'AES_GCM')
print("Wynik AES GCM:", result_aes_gcm.hex(), "Tag:", tag, "Klucz:", key, "IV:", iv.hex())
print("\n")

# RSA
# wynik = what_to_run(string_wejsciowy, wielkosc_klucza, 'RSA_encrypt') <- tu brak klucza na wyjściu bo jest za długi
result_RSA = what_to_run("Hello, World!", 1024, 'RSA_encrypt')
print("Wynik RSA:", result_RSA.hex(), "Długość klucza:", len(result_RSA) * 8, "bitów")
    