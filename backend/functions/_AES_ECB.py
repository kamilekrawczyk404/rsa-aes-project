import _mainAES

def AES_ECB_encrypt(plaintext, key): # plaintext to string, key to 128 bitowy ciąg (defacto int)
    input = plaintext.encode('utf-8') # zamiana na bajty

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
    for i in range(0, len(input), 16):  # krok co 16 bajtów
        output += _mainAES.main(input[i:i+16], key) # w tym miejscu i jest indeksem pierwszego bajtu bloku 16 bajtowego -> nie jest indeksem każdego kolejnego bajtu!

    flat_output = []
    for item in output:
        if isinstance(item, list):
            flat_output.extend(item)
        else:
            flat_output.append(item)

    return bytes(flat_output)

result = (AES_ECB_encrypt("Hello, World!", 0x3f7a9c12b4e6d09f5a2c7e8b1d4f6032))
print(result)
#print("\n")
#for row in result:
#    print([hex(x) for x in row])