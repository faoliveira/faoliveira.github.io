---
layout: post
title: A linguagem VBA
date: 2016-07-08 12:00:00
disqus: true
---

Acredito que antes de trabalhar em algo na cozinha, você precisa estar familiarizado com os ingredientes antes de tentar cozinhar. Dessa forma podemos é necessário entender a lógica dos componentes do editor de VBA.

![Editor](/assets/images/vba_editor.JPG)

#### Componentes

##### Módulo
O módulo é o recipiente para seu código. Um único módulo pode conter um ou vários macros.

##### EstaPasta_de_trabalho (Workbook)
O módulo do Workbook é para manipulação de eventos em nível maior, ou seja, irá compartilhar eventos de todas Planilhas, Módulos etc.

##### Planilha1 (Worksheet)
A Microsoft refere-se ao código da Worksheet como procedimentos, onde são ligados a vários eventos como selecionar um intervalo de células.

##### Módulo de classe (Class Model)
Um módulo de classe parece com qualquer outro módulo e aje como um. É basicamente algo que irá lhe ajudar a fazer um código mais limpo, de fácil leitura. 

##### Formulários (UserForm)
Está relacionado a interface do usuário. Aje como um módulo de classe.

#### VBA Macro
A sintaxe do VBA Macro começa com a palavra-chave *Sub* e termina com *End Sub*

```vbscript
Sub ola()
    'comentários no código
    MsgBox "Primeiro Hello World"
End Sub
```

#### Tipos de dados

É bastante similar a tipo de dados de outras linguagens, então quem já estudou algoritmos não terá dificuldades. Apenas um resumo com pequenos exemplos, no site da [Microsoft](https://msdn.microsoft.com/en-us/library/47zceaw7.aspx) poderá encontrar a referência com todos os tipos.

- Variant type
  O tipo de dado  padrão. Pode armazenar qualquer tipo de valor.
  
```vbscript  
Sub Exemplo()
    Dim NomesArray() As Variant
	Dim Familia As String
	NomesArray = Array("Lisa", "Bart", "Homer", "Margie", "Maggie")
	Familia = NomesArray(2)
	MsgBox Familia
End Sub
```

A mensagem retornará o nome de Homer, pois ele ocupa a segunda possição. Lembrar sempre que o valor inicial é 0, logo Lisa ocupa a posição 0.

- ​String type

  Para caracteres não númericos.
  
```vbscript    
Sub Exemplo3()
    Dim Usuario As String
    Usuario = "Ford Prefect" 
    ActiveCell.FormulaR1C1 = Usuario
End Sub
``` 

- ​Integer types.
   O valor padrão para todo número integral é 0
  
- ​Boolean type.
   Usado para valores True e False. O valor padrão é False.
  
- ​Date type.
   O valor padrão é 12/30/1899 00:00:00
  
```vbscript 
Sub Exemplo2()
    Dim Aniversario As Date 
    Aniversario = #7/7/2016#
    ActiveCell.FormulaR1C1 = Aniversario
End Sub
```

No exemplo abaixo usamos não só uma atribuição (=) e a concatenação (&), mas também operadores de lógica e comparação.

```vbscript
Sub condicional()
    Dim x, y As Integer
    x = 20
    y = 10
    If x > y Then
    MsgBox "O maior valor é " & x
    Else
    MsgBox "O maior valor é " & y
    End If
End Sub
```

Existe vários sites onde pode consultar as funções do VBA, particularmente gosto do [TechOnTheNet](http://www.techonthenet.com/excel/formulas/index_vba.php). Lá poderá ver as funções com exemplos.

![Exemplos de funções](/assets/images/totn_example.JPG)

Para terminar, uma lista de atalhos de teclados no editor:

    ALT+F11- Visualizar o VBA Editor
    ALT+F8- Mostra todos os Macros
    ALT+Q- Fecha o VBA Editor() e returna ao Excel
    F5- Roda o macro
    F2- Mostra Pesquisado de objeto
    F7- Mostra o editor de código
    Ctrl+G – Janela de verificação imediata
    F4 – Propriedades
    Ctrl+R – Project Explorer