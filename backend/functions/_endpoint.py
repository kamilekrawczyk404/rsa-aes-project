import _AES_ECB
import _RSA
def what_to_run(input_data, key_length, mode):
    if mode == 'AES_ECB':
        return _AES_ECB.AES_ECB_encrypt(input_data, key_length)
    elif mode == 'RSA_encrypt':
        return _RSA.main_input(input_data, key_length)
    else:
        raise ValueError("Nieznany tryb działania.")
    


#przykład użycia:
result_aes = what_to_run("Hello, World!", 128, 'AES_ECB')
print("Wynik AES ECB:", result_aes)

result_RSA = what_to_run("Hello, World!", 2048, 'RSA_encrypt')
print("Wynik RSA Encrypt:", result_RSA)
    