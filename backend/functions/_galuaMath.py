def backToGalua(c : int):
    special = 0b11011 # x^8 = x^4 + x^3 + x + 1 -> bitowa reprezentacja
    special = special << (c.bit_length() - 1 - 8) # przesunięcie bitowe o tyle ile nasze c (wynik) wykracza poza pole galua (8 bitów)
    # ^^ odejmuję jeszcze 1 bo inaczej przesuwa się o 1 bit za daleko (nie rozumiem dlaczego) -> 
    # ok, już wiem -> bo ja liczyłem różnicę między reprezentacją wielomianową i porównywałem do bitowej -> czyli c.bit.length() zwróci o 1 więcej niż przewidywałem
    # print("special:", bin(special)) # do debugowania
    c = c & ((1 << (c.bit_length() -1 )) - 1) # skoro zamieniliśmy najwyższy bit na special (np. x^11 = x^7 + x+6 + x^4 + x^3) to go usuwamy
    c = c ^ special
    # print(bin(c)) # do debugowania
    if (c.bit_length() > 8): # jeżeli nadal wykracza wywołujemy funkcję ponownie na zmieniejosznym już uprzednio c
        c =  backToGalua(c) # tu zadziałałoby też  'return backToGalua(c)' ale nie rozumiem tego do końca
    return c

def multiply(a: int, b: int) -> int: # tutaj muszę pracować na intach bo python nie obsługuje typu binarnego
    table = []
    for i in range(b.bit_length()):  # przejdź przez wszystkie bity
        bit = (b >> i) & 1 # to jakby patrzy na i-ty bit od tyłu i wyciąga wartość ciąg długości 1 od tego miejsca
        if bit == 1:
            table.append(a << i)  # przesuwa a o i miejsc w lewo i dodaje do tabeli -> tak jak przy mnożeniu pisemnym
    c = 0
    for j in table:
        c = c ^ j  # dodaje wszystkie wartości z tabeli
    if c.bit_length() > 8: 
        c = backToGalua(c)

    return c

def findReverseBruteForce(a : int) -> int: # jest to implementacja nieodporna na ataki mierzące czas wykonania -> ujawnia informację
    for i in range(2 ** a.bit_length()): # iteruje po wszystkich liczbach od 0 do 255
        if (multiply(a, i) == 1): # jeżeli a mnożony przez i daje jeden to oznacza to, że jest to element odwrotny
            return i



        

print(bin(multiply(0b01010111, 0b00010011)))
print(bin(multiply(0x99, 0x6754)))

print(bin(findReverseBruteForce(0b11001000)))