**De:** Equipo de Desarrollo - Proyecto ERCOT  
**Para:** Daniel Llarens; Santiago Masiriz; Manuel Tinoco; Rodrigo Perez; Alejandro Mina  
**CC:** Dirección General  
**Asunto:** Minuta Reunión - ERCOT Pricing Dashboard - 30/Enero/2026  
**Fecha:** 30 de Enero de 2026

---

Estimados colegas,

Comparto un resumen de los acuerdos y acciones derivadas de la reunión de hoy sobre el proyecto ERCOT Pricing Dashboard.

**Resumen de la Reunión:**  
Se revisó el estado actual del dashboard y se identificaron mejoras necesarias en la documentación y funcionalidad. Se confirmó la resolución de problemas técnicos (mapa en blanco y gráfico de promedio mensual histórico). Además, Diego Perdomo completó y obtuvo aprobación del disclaimer legal para el uso de datos, el cual ya está listo para implementación.

**Acciones - Equipo EMI (Daniel Llarens, Santiago Masiriz, Manuel Tinoco):**  
Deberán proporcionar las descripciones detalladas para cada componente del dashboard: Grid Cell Price Heatmap, Historical Monthly Average, gráfico de Distribución, y gráfico de Congestión (este último debe incluir el cálculo utilizado). También deberán definir y confirmar las unidades correctas a mostrar en cada pantalla, así como las descripciones para los ejes X de los gráficos. Finalmente, se requiere definición sobre la política de cobro para la exportación de datos.

**Acciones - Equipo de Desarrollo (Rodrigo Perez, Alberto Pezzi, Alejandro Mina):**  
Una vez recibidas las descripciones del Equipo EMI, se deberán implementar en todas las pantallas correspondientes. Se debe implementar la lógica para ocultar el gráfico de congestión cuando el tipo de dato seleccionado no sea "PRICE" (es decir, cuando sean reservas como Solar Capture, Wind Capture o Negative Hours). Adicionalmente, se debe completar la visualización de información histórica del productor para el 31 de enero, y evaluar la viabilidad de implementar capas separadas en el mapa para diferentes tipos de datos.

**Próximos Pasos:**  
Esperamos recibir las descripciones y definiciones del Equipo EMI a la brevedad para proceder con la implementación. La próxima reunión se coordinará para revisar el avance de estas mejoras y la información histórica implementada.

Quedo atento a sus comentarios.

Saludos cordiales,

**Equipo de Desarrollo - Proyecto ERCOT**
