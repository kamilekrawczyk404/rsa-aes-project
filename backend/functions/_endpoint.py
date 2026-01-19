from . import _AES_ECB
from . import _AES_CBC
from . import _AES_GCM
from . import _RSA
def what_to_run(input_data, key_length, mode):
    if mode == 'AES_ECB':
        return _AES_ECB.AES_ECB_encrypt(input_data, key_length)
    elif mode == 'AES_CBC':
        return _AES_CBC.AES_CBC_encrypt(input_data, key_length)
    elif mode == 'AES_GCM':
        return _AES_GCM.AES_GCM_encrypt(input_data, key_length)
    elif mode == 'RSA_encrypt':
        return _RSA.main_input(input_data, key_length)
    else:
        raise ValueError("Nieznany tryb działania.")
    


#przykład użycia:

#print (f"Dane wejściowe: 'Hello, World!' ->" + f" hex: {b'Hello, World!'.hex()}\n")

# AES ECB
# wynik, klucz = what_to_run(string_wejsciowy, wielkosc_klucza, 'AES_ECB')
#result_aes_ecb, key = what_to_run("Hello, World!", 128, 'AES_ECB')
#print("Wynik AES ECB:", result_aes_ecb.hex(), "Klucz:", key)
#print("\n")

# AES CBC
# wynik, klucz, iv = what_to_run(string_wejsciowy, wielkosc_klucza, 'AES_CBC')
#result_aes_cbc, key, iv = what_to_run("Hello, World!", 192, 'AES_CBC')
#print("Wynik AES CBC:", result_aes_cbc.hex(), "Klucz:", key, "IV:", iv.hex())
#print("\n")

# AES GCM
# wynik, tag, klucz, iv = what_to_run(string_wejsciowy, wielkosc_klucza, 'AES_GCM')
#result_aes_gcm, tag, key, iv = what_to_run("Hello, World!", 256, 'AES_GCM')
##print("Wynik AES GCM:", result_aes_gcm.hex(), "Tag:", tag, "Klucz:", key, "IV:", iv.hex())
#print("\n")

# RSA
# wynik = what_to_run(string_wejsciowy, wielkosc_klucza, 'RSA_encrypt') <- tu brak klucza na wyjściu bo jest za długi
#result_RSA = what_to_run("Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?", 2048, 'RSA_encrypt')
#print("Wynik RSA:", result_RSA.hex())
    