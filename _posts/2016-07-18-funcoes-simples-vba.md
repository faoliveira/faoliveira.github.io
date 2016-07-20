---
layout: post
title: Funções Simples em VBA
date: 2016-07-18
disqus: true
excerpt: Sempre fui dos que preferem aprender olhando exemplos, então segue uma lista com pequenas funções em VBA
---

Particulamente sempre fui dos que preferem aprender olhando exemplos. Não que a teoria seja desnecessária, mas como dito no [texto anterior](http://faoliveira.me/2016/07/linguagem-vba), dá para consutar todas as funções do VBA no [TechOnTheNet](http://www.techonthenet.com/excel/formulas/index_vba.php) e no site da [Microsoft](https://msdn.microsoft.com/en-us/library/sh9ywfdk.aspx). A lógica do VBA no fim é igual a de qualquer outra linguagem aprendida. Desse modo, vamos a prática.

### Gerando números que não mudam

No Excel temos a função RAND() e RANDBETWEEN() - ALEATÓRIO() e ALEATÓRIOENTRE() - onde o programa irá gerar números aleatórios. Contudo, será gerado um novo valor toda vez que a planilha for aberta ou quando apertar F9. Pelo VBA dá para gerar uma função que não recalcula.

```vb
Function ALEATORIOLOCK() As Double
	ALEATORIOLOCK = Rnd
End Function
```

É uma função bem simples. Registramos o tipo de dado como Double, onde armazena dados de -1.79769313486231570E+308 até 1.79769313486231570E+308. Mas vamos dizer que na verdade você quer gerar um número inteiro aleatório de 1 a 99, podemos realizar com ALEATORIOLOCKENTRE(1;99) com:

```vb
Function ALEATORIOLOCKENTRE(lo As Long, hi As Long) As Long
    ALEATORIOLOCKENTRE = Int((hi - lo + 1) * Rnd + lo)
End Function
```

### Bônus

Até agora funções simples de 3 linhas. Vamos agora supor que você deseja criar uma planilha que calcule o bônus por metas de venda de seus funcionários.

| Meta de Vendas          | Bônus |
| ----------------------- | ----- |
| Menor $100.000          | 5%    |
| De $100.000 até 199.999 | 10%   |
| Maior $199.999          | 20%   |

Não seria difícil resolver o problema através da fórmula PROCV (VLOOKUP) ou até mesmo com SE(IF), só que vamos criar uma fórmula usando BONUS():

```vb
Function BONUS(Meta As Double) As Double
    Const Tier1 As Double = 0.05
    Const Tier2 As Double = 0.1
    Const Tier3 As Double = 0.2
    Select Case Meta
    Case Is >= 200000
    BONUS = Meta * Tier3
    Case Is >= 100000
    BONUS = Meta * Tier2
    Case Is < 100000
    BONUS = Meta * Tier1
    End Select
End Function
```

### Trabalhando com texto

O excel possui as funções PROCURAR, LOCALIZAR e PESQUISAR, entretanto nenhuma delas irá checar se aquela palavra realmente está na cadeia por completo.

| Texto                  | Palavra |
| ---------------------- | ------- |
| O rato roeu a roupa... | roupa   |
| O rato roeu a roupa... | rato    |
| O rato roeu a roupa... | rou     |
| O rato roeu a roupa... | ro      |

Com o código abaixo, a função irá retornar através do dado Boolean VERDADEIRO ou FALSO na ordem Verdadeiro, Verdadeiro, Falso e Falso.

```vb
Function PALAVRA(Text As String, Word As String) As Boolean
  PALAVRA = " " & UCase(Text) & " " Like "*[!A-Z]" & UCase(Word) & "[!A-Z]*"
End Function
```

Agora vamos supor que você tenha uma lista de funcionários e queira que em outra coluna retorne com as iniciais dos nomes de cada um. 

```vb
Function INICIAL(text As String) As String
    Dim TextLen As Long
    Dim i As Long
    text = Application.Trim(text)
    TextLen = Len(text)
    INICIAL = Left(text, 1)
    For i = 2 To TextLen
    If Mid(text, i, 1) = " " Then
    INICIAL = INICIAL & Mid(text, i + 1, 1)
    End If
    Next i
    INICIAL = UCase(INICIAL)
End Function
```

Através da função INICIAL(), quando tiver o nome Machado de Assis, irá retonar o valor MDA na outra coluna. Pode conferir todas os códigos acima na planilha através do [link para download](https://db.tt/0eC0xvXv). Todas as funções mostradas aqui são (relativamente) simples, para realmente tentar raciocinar o passo a passo de cada lógica. Aos que desejam excercitar, recomendo o site [WiseOwl](http://www.wiseowl.co.uk/free-exercises/excel-vba-macros.htm).