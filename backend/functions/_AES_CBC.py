from . import _mainAES
from . import _mainAES_192
from . import _mainAES_256
import os

def bytes_to_int(b):
    return int.from_bytes(b, 'big')

def int_to_bytes(i, length=16):
    return i.to_bytes(length, 'big')

def list_to_int(l):
    return bytes_to_int(bytes(l))

def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))

def pkcs7_pad(data):
    pad_len = 16 - (len(data) % 16)
    return data + bytes([pad_len] * pad_len)

def AES_CBC_encrypt(plaintext, key_length):
    if isinstance(plaintext, str):
        plaintext_bytes = plaintext.encode('utf-8')
    else:
        plaintext_bytes = plaintext

    if key_length == 128:
        aes_module = _mainAES
    elif key_length == 192:
        aes_module = _mainAES_192
    elif key_length == 256:
        aes_module = _mainAES_256
    else:
        raise ValueError("Invalid key length")

    key_bytes = os.urandom(key_length // 8)
    key = bytes_to_int(key_bytes)
    iv = os.urandom(16)

    def encrypt_block_get_bytes(input_bytes, key_int):
        raw_output = aes_module.main(input_bytes, key_int)
        
        flat_list = []
        is_matrix = isinstance(raw_output, list) and len(raw_output) == 4 and isinstance(raw_output[0], list)
        
        if is_matrix:
            for row in raw_output:
                flat_list.extend(row)
        else:
            flat_list = raw_output

        final_list = []
        for x in flat_list:
            if isinstance(x, str):
                final_list.append(int(x, 16))
            else:
                final_list.append(x)
                
        return bytes(final_list)

    padded_text = pkcs7_pad(plaintext_bytes)
    ciphertext = bytearray()
    
    previous_block = iv

    for i in range(0, len(padded_text), 16):
        current_block = padded_text[i:i+16]
        
        xor_input = xor_bytes(current_block, previous_block)
        
        encrypted_block = encrypt_block_get_bytes(xor_input, key)
        
        ciphertext.extend(encrypted_block)
        previous_block = encrypted_block

    return bytes(ciphertext), hex(key)[2:], iv

plaintext_input = "Hello, World!"
key_len = 128

cipher_text, key, iv = AES_CBC_encrypt(plaintext_input, key_len)

#print(f"Plaintext (hex):  {plaintext_input.encode('utf-8').hex()}")
#print(f"Key (hex):        {key}")
#print(f"IV (hex):         {iv.hex()}")
#print(f"Ciphertext (hex): {cipher_text.hex()}")