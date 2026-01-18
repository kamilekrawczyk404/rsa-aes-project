from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
""""
key = bytes.fromhex("78a8f0015660d4027cd2b0e845194751")
txt = bytes.fromhex("48656c6c6f2c20576f726c6421")
padded_txt = pad(txt, 16)
cipher = AES.new(key, AES.MODE_ECB)
print(cipher.encrypt(padded_txt).hex())
"""
key = bytes.fromhex("55845154c782535a8e35ba80d7b8651c7a9cc470a8eb7917e320859a9ab0c51e")
iv_bytes = bytes.fromhex("b2405bc8b87f4679118723d1")
txt = bytes.fromhex("48656c6c6f2c20576f726c6421")
cipher = AES.new(key, AES.MODE_GCM, nonce=iv_bytes)
print(cipher.encrypt(txt).hex())