import _key_expansion_256
import _galuaMath

def main(inputText, key):
    expandedKey = _key_expansion_256.getExpandedKey(key)
    
    inputBytes = inputText
    textMatrix = [[0 for _ in range(4)] for _ in range(4)]
    
    for i in range(4): 
      for j in range(4):
        textMatrix[i][j] = inputBytes[i*4 + j]

    for i in range(4): 
       for j in range(4):
          textMatrix[i][j] = textMatrix[i][j] ^ expandedKey[i][j]

    for r in range(14):
        for i in range(4):
            for j in range(4):
                textMatrix[i][j] = _key_expansion_256.SBoxMap(textMatrix[i][j])
        
        helperMatrix = [row.copy() for row in textMatrix]
        textMatrix[0][0] = helperMatrix[0][0]
        textMatrix[0][1] = helperMatrix[1][1]
        textMatrix[0][2] = helperMatrix[2][2]
        textMatrix[0][3] = helperMatrix[3][3]
        textMatrix[1][0] = helperMatrix[1][0]
        textMatrix[1][1] = helperMatrix[2][1]
        textMatrix[1][2] = helperMatrix[3][2]
        textMatrix[1][3] = helperMatrix[0][3]
        textMatrix[2][0] = helperMatrix[2][0]
        textMatrix[2][1] = helperMatrix[3][1]
        textMatrix[2][2] = helperMatrix[0][2]
        textMatrix[2][3] = helperMatrix[1][3]
        textMatrix[3][0] = helperMatrix[3][0]
        textMatrix[3][1] = helperMatrix[0][1]
        textMatrix[3][2] = helperMatrix[1][2]
        textMatrix[3][3] = helperMatrix[2][3]

        if r != 13: 
            constantsMatrix = [[0x02, 0x01, 0x01, 0x03], [0x03, 0x02, 0x01, 0x01], [0x01, 0x03, 0x02, 0x01], [0x01, 0x01, 0x03, 0x02]]
            helperMatrix2 = [[0 for _ in range(4)] for _ in range(4)]
            for i in range(4):
                for j in range(4):
                    for k in range(4):
                        if constantsMatrix[k][j] != 0:
                            helperMatrix2[i][j] ^= _galuaMath.multiply(textMatrix[i][k], constantsMatrix[k][j])
            textMatrix = helperMatrix2

        for i in range(4): 
            for j in range(4):
                textMatrix[i][j] = textMatrix[i][j] ^ expandedKey[4 * (r + 1) + i][j]

    #for row in textMatrix:
        #print([hex(b) for b in row])
    return textMatrix