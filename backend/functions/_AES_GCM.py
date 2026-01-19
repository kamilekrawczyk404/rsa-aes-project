from . import _mainAES
from . import _mainAES_192
from . import _mainAES_256
import os

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

def gf_mult(x, y):
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
    y = 0
    if len(data) % 16 != 0:
        data += bytes(16 - (len(data) % 16))
    for i in range(0, len(data), 16):
        block = bytes_to_int(data[i:i+16])
        y ^= block
        y = gf_mult(y, h)
    return y

def AES_GCM_encrypt(plaintext, key_length, aad=b''):
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
    iv = os.urandom(12)

    def encrypt_block_to_int(input_bytes, key_int):
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
        return list_to_int(final_list)

    h_int = encrypt_block_to_int(bytes(16), key)
    j0_int = bytes_to_int(iv + b'\x00\x00\x00\x01')

    ciphertext = bytearray()
    counter = j0_int
    num_blocks = (len(plaintext_bytes) + 15) // 16

    for i in range(num_blocks):
        high_96 = counter >> 32
        low_32 = counter & 0xFFFFFFFF
        low_32 = (low_32 + 1) & 0xFFFFFFFF
        counter = (high_96 << 32) | low_32

        encrypted_counter = encrypt_block_to_int(int_to_bytes(counter), key)
        chunk = plaintext_bytes[i*16 : (i+1) * 16]
        enc_counter_bytes = int_to_bytes(encrypted_counter)
        chunk_cipher = xor_bytes(chunk, enc_counter_bytes[:len(chunk)])
        ciphertext.extend(chunk_cipher)

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
    tag_mask = encrypt_block_to_int(int_to_bytes(j0_int), key)
    tag = s_tag ^ tag_mask

    return bytes(ciphertext), int_to_bytes(tag), hex(key)[2:], iv

cipher_text, tag, key, iv = AES_GCM_encrypt("Hello, World!", 128)
#print(f"Plaintext(hex):  {"Hello, World!".encode('utf-8').hex()}")
#print(f"Key (hex):        {key}")
#print(f"IV (hex):         {iv.hex()}")
#print(f"Ciphertext (hex): {cipher_text.hex()}")
#print(f"Auth Tag (hex):   {tag.hex()}")