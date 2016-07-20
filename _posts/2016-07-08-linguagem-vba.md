---
layout: post
title: A linguagem VBA
date: 2016-07-08 12:00:00
disqus: true
excerpt: Antes de trabalhar em algo na cozinha, você precisa estar familiarizado com os ingredientes antes de tentar cozinhar.
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

```vb
Sub ola()
    'comentários no código
    MsgBox "Primeiro Hello World"
End Sub
```

#### Tipos de dados

É bastante similar a tipo de dados de outras linguagens, então quem já estudou algoritmos não terá dificuldades. Apenas um resumo com pequenos exemplos, no site da [Microsoft](https://msdn.microsoft.com/en-us/library/47zceaw7.aspx) poderá encontrar a referência com todos os tipos.

- Variant type
  O tipo de dado  padrão. Pode armazenar qualquer tipo de valor.

```vb
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

```vb
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

```vb
Sub Exemplo2()
    Dim Aniversario As Date 
    Aniversario = #7/7/2016#
    ActiveCell.FormulaR1C1 = Aniversario
End Sub
```

No exemplo abaixo usamos não só uma atribuição (=) e a concatenação (&), mas também operadores de lógica e comparação.

```vb
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


#### Fórmulas Personalizadas

Todos devem já estar familiarizados com as fórumas do Excel como SOMA, SE, MEDIA entre outras. O qual na versão 2016 dá mais de 400 fórmulas estabelecidas no programa. Não obstante a isso, pode-se criar ainda mais com o VBA, as *user-defined functions*. Para criar, basta no editor iniciar a fórmula deseja com Function NOMEDAFORMULA().

A sintaxe para declarar uma função será a seguinte:

```vb
[Public | Private][Static] Function name ([arglist]) [As type]
	[statements]
	[name = expression]
	[Exit Function]
	[statements]
	[name = expression]
End Function
```

- **Public**: Indica que a função é disponível para todos outros os módulos na pasta de trabalho (Opcional)


- **Private**: Indica que a função está disponível para outros procedimentos somente no mesmo módulo. Lembrando que uma função Private não irá aparecer na caixa de diálogos de AutoComplete (Opcional)


- **Static**: Indica que os valores das variáveis declaradas na função estão preservadas entre chamadas (Opcional)


- **Function**: Indica o começo do procedimento da função (Obrigatório)


- **Nome**: Será o nome atribuido a função (Obrigatório)


- **Arglist**: Uma lista de um ou mais variáveis que representam os argumentos passados para a função. Os argumentos são colocados entre parênteses. Use uma vírgula para separar argumentos (Opcional)


- **Type**: O tipo de dado retornado pela função.Quando não declarado, o tipo de dado atribuído será Variant. (Opcional)


- **Statements**: É uma instrução completa. Contendo variáveis, contantes, expressões etc. (Opcional)



O exemplo abaixo é uma fórmula que ao usar USER() na planilha, retorna o nome do usuário.

```vb
Function USER()
	USER = Application.UserName
End Function
```

**Lembrete**: Coloque suas fórmulas em módulos. Além que fórmulas são **passivas**, não podem alterar qualquer coisa na planilha. Ou seja, não irá mudar cor ou tamanho da fonte. Fórmulas sempre irão mostrar valores.



Para terminar, uma lista de atalhos de teclados no editor:

    ALT+F11- Visualizar o VBA Editor
    ALT+F8- Mostra todos os Macros
    ALT+Q- Fecha o VBA Editor e returna ao Excel
    F5- Roda o macro
    F2- Mostra Pesquisado de objeto
    F7- Mostra o editor de código
    Ctrl+G – Janela de verificação imediata
    F4 – Propriedades
    Ctrl+R – Project Explorer