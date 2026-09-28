# Colección de Chapas

App de celular para coleccionistas: tener la colección inventariada y online, y conectar con otros coleccionistas.

> Documento de idea y arquitectura propuesta. Todavía no hay código: esto es para revisar y corregir entre los socios antes de empezar.

## El problema

Los coleccionistas necesitan tener la colección ordenada. Hoy cada uno lo resuelve como puede: con un programa propio (por ejemplo, en Visual Basic) o con planillas de Excel hechas a mano.

## Lo principal de la app

1. **Inventario permanente y online:** tu colección actualizada y disponible desde donde estés.
2. **Contacto entre coleccionistas:** publicar, vender, comprar e intercambiar, con reputación, garantías y ranking.

## Funciones

- **Inventariar:** cargar cada pieza con fotos y datos.
- **Contar:** totales por categoría, país, marca, etc.
- **Ordenar y buscar:** búsquedas cruzadas y filtros. Referencia: [crowncaps.info](https://crowncaps.info/).
- **Conectar:** con otros coleccionistas.
- **Que se pueda adaptar:** cada colección tiene sus propios datos. No se registra lo mismo de una chapita que de un calefón, una lata o una birome.
- **Importar desde Excel, al estilo Banco Roela:** una planilla modelo que el usuario completa y sube, y la app carga los datos sola. También tiene que aceptar los Excel que la gente ya tiene armados y adaptarlos.

## Arquitectura propuesta

| Parte | Propuesta | Por qué |
|---|---|---|
| App de celular | **React Native + Expo** | Un solo código sirve para Android y iPhone, y también podría tener versión web. |
| Base de datos online | **Supabase** | Incluye la base de datos, las cuentas de usuario, el guardado de fotos y el chat. Tiene un plan gratis para arrancar. |
| Datos que cambian según la colección | **Campos personalizados** | Cada tipo de colección define sus campos (para chapas: país, marca, color, texto, año, estado). Además, plantillas listas: chapas, latas, biromes, etc. |
| Importar Excel | **Planilla modelo + asistente** | La app genera una planilla modelo según los campos de tu colección. Si alguien sube su propio Excel, un asistente le pregunta a qué campo corresponde cada columna. |

## Etapas

1. **Inventario (primera versión):** cuentas de usuario, colecciones con campos propios, carga con fotos, conteos, búsqueda y filtros, e importar y exportar Excel. Ya con esto la app sirve y se puede usar.
2. **Comunidad:** perfiles públicos, catálogo compartido estilo crowncaps, publicaciones para vender o intercambiar, chat, reputación y ranking.
3. **Garantías y pagos:** por ejemplo con MercadoPago. Es la etapa más compleja y tiene temas legales, así que conviene dejarla para después de validar lo anterior.

## Pendiente de definir

- [ ] **El Visual Basic actual:** ¿es un Excel con macros o una base de Access? Sirve para armar los campos de "chapas" y como primera importación real.
- [ ] **Sin conexión:** ¿hay que poder cargar y consultar la colección sin señal (por ejemplo, en una feria de canje)?
- [ ] **Catálogo compartido:** ¿cada uno maneja solo su colección, o además hay una biblioteca pública donde una misma pieza figura una sola vez y cada coleccionista marca "la tengo"?
- [ ] **Compra y venta:** en la etapa 2, ¿alcanza con contactar al otro y calificarlo después, o los pagos tienen que hacerse dentro de la app desde el principio?
- [ ] **Nombre de la app e idioma:** ¿solo español y Argentina al principio?
- [ ] **Herramientas:** confirmar Expo + Supabase.
