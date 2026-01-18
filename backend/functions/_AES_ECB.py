import _mainAES
import _mainAES_192
import _mainAES_256
import os

def AES_ECB_encrypt(plaintext, key_length): # plaintext to string, key to 128 bitowy ciąg (defacto int)
    input = plaintext.encode('utf-8') # zamiana na bajty
    key_bytes_len = key_length // 8
    print("tekst wejściowy (hex):", input.hex())

    key = os.urandom(key_bytes_len)
    key_int = int.from_bytes(key, 'big')
    # padding -> w standardzie PKCS#7

    if len(input) % 16 != 0:
        padding_length = 16 - (len(input) % 16)
        input += bytes([padding_length] * padding_length)
    else:
        padding_length = 16 # tutaj mimo wszystko dodaję cały blok, ponieważ muszę jakoś wiedzieć na końcu gdzie był padding
        input += bytes([padding_length] * padding_length)
    # czyli jeśli np. padding ma długość 5 to dodaje 5 bajtów o wartości 0x05 -> czyli 5 bajtów po 5
    # wszystko po to żeby pracować na blokach 16 bajtowych
    output = []
    if key_bytes_len == 16: # AES-128
        for i in range(0, len(input), 16):  # krok co 16 bajtów
            output += _mainAES.main(input[i:i+16], key_int) # w tym miejscu i jest indeksem pierwszego bajtu bloku 16 bajtowego -> nie jest indeksem każdego kolejnego bajtu!
    elif key_bytes_len == 24: # AES-192
        for i in range(0, len(input), 16):
            output += _mainAES_192.main(input[i:i+16], key_int)
    elif key_bytes_len == 32: # AES-256
        for i in range(0, len(input), 16):
            output += _mainAES_256.main(input[i:i+16], key_int)
    flat_output = []
    for item in output:
        if isinstance(item, list):
            flat_output.extend(item)
        else:
            flat_output.append(item)

    return bytes(flat_output), key.hex()

result, key = (AES_ECB_encrypt("Hello, World!", 128))
#print("wynik:", result.hex())
#print("klucz:", key)
#print("\n")
#for row in result:
#    print([hex(x) for x in row])