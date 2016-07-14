---
layout: post
title: A lógica de VBA
date: 2016-07-08 12:00:00
disqus: true
---

<br>
Acredito que antes de trabalhar em algo na cozinha, você precisa estar familiarizado com os ingredientes antes de tentar cozinhar. O editor de VBA pode ser separado em 5 componentes

#### Componentes
##### Módulos
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

#### VBA Macro

- ​Variant type
- ​String type
- ​Integer types
- ​Boolean type
- ​Floating-point types
- ​Scaled types
- ​Date type
- ​Enumerations
- ​Object types
- ​User-Defined type



Para terminar, uma lista de atalhos de teclados no editor:
ALT+F11- Visualizar o VBA Editor
ALT+F8- Mostra todos os Macros
ALT+Q- Fecha o VBA Editor e returna ao Excel
F5- Roda o macro
F2- Mostra Pesquisado de objeto
F7- Mostra o editor de código
Ctrl+G – Janela de verificação imediata
F4 – Proprieades
Ctrl+R – Project Explorer