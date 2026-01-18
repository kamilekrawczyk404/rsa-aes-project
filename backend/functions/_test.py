from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
key = bytes.fromhex("c1a374694728f1c6c3ce42a96ed98d45e7595dfca9429275ce7e7e1e134be363")
txt = bytes.fromhex("48656c6c6f2c20576f726c6421")
padded_txt = pad(txt, 16)
cipher = AES.new(key, AES.MODE_ECB)
print(cipher.encrypt(padded_txt).hex())