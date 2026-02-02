**De:** Equipo de Desarrollo - Proyecto ERCOT  
**Para:** Equipo EMI; Equipo de Desarrollo  
**CC:** Dirección General  
**Asunto:** Minuta de Reunión - Proyecto ERCOT Pricing Dashboard - 30/Enero/2026  
**Fecha:** 30 de Enero de 2026

---

Estimados colegas,

Comparto la minuta de la reunión realizada el día de hoy sobre el proyecto ERCOT Pricing Dashboard.

---

## INFORMACIÓN DE LA REUNIÓN

**Fecha:** 30 de Enero de 2026  
**Hora:** 11:56 - 12:42  
**Proyecto:** ERCOT Pricing Dashboard  

### PARTICIPANTES

**Equipo EMI:**
- Daniel Llarens
- Santiago Masiriz
- Manuel Tinoco

**Equipo de Desarrollo:**
- Rodrigo Perez
- Alberto Pezzi
- Alejandro Mina

---

## TEMAS TRATADOS

### 1. Documentación y Descripciones de Pantallas
Se identificó la necesidad de agregar descripciones detalladas para cada componente de visualización en el dashboard:

#### 1.1 Grid Cell Price Heatmap
- **Requerimiento:** Agregar descripción explicativa de esta pantalla principal
- **Estado:** Pendiente de recibir texto descriptivo

#### 1.2 Historical Monthly Average
- **Requerimiento:** Incluir descripción del gráfico de evolución temporal
- **Estado:** Pendiente de recibir texto descriptivo

#### 1.3 Distribución de Precios
- **Requerimiento:** Agregar descripción del gráfico de distribución
- **Estado:** Pendiente de recibir texto descriptivo

#### 1.4 Ejes de Gráficos
- **Requerimiento:** Incorporar descripción del eje X en los gráficos correspondientes
- **Estado:** Pendiente de implementación

### 2. Ajuste de Unidades
- **Requerimiento:** Revisar y ajustar las unidades mostradas en cada pantalla para asegurar consistencia y claridad
- **Estado:** Pendiente de revisión

### 3. Exportación de Datos
- **Tema:** Se consultó sobre la política de exportación de datos
- **Pregunta:** ¿Se cobrarán los datos exportados?
- **Estado:** Pendiente de definición comercial

### 4. Gráfico de Congestión
#### 4.1 Descripción
- **Requerimiento:** Agregar descripción del gráfico de congestión
- **Requisito especial:** La descripción debe incluir el cálculo utilizado

#### 4.2 Funcionalidad Específica
- **Aclaración:** El gráfico de congestión aplica **únicamente para datos de tipo PRICE**
- **Restricción:** No se debe presentar el gráfico cuando se seleccionen datos de tipo "reservas" (Solar Capture, Wind Capture, o Negative Hours)
- **Alcance:** El cálculo se realiza solo entre los nodos seleccionados

### 5. Mejoras Propuestas para el Mapa
- **Propuesta:** Implementar capas separadas en el mapa de calor para mejorar la visualización
- **Capas sugeridas:**
  - Capacidad de la cuadrícula
  - Intensidad eléctrica
  - Precios
- **Estado:** En evaluación

### 6. Problemas Técnicos Identificados

#### 6.1 Mapa en Blanco
- **Descripción:** Durante la reunión se experimentó un problema donde el mapa se mostraba completamente en blanco
- **Causa probable:** Configuración del navegador (caché o cookies)
- **Acciones tomadas:**
  - Inspección de consola del navegador
  - Eliminación de datos de navegación
- **Estado:** Problema resuelto ✓

### 7. Disclaimer Legal y de Uso

#### 7.1 Coordinación con Área Legal
- **Responsable:** Diego Perdomo (contactado por Alberto Pezzi)
- **Compromiso:** Elaborar disclaimer para el uso de datos y la aplicación
- **Proceso de aprobación:**
  1. Redacción por parte de Diego Perdomo ✓
  2. Aprobación por Equipo EMI ✓
  3. Aprobación por Dirección General ✓
- **Estado:** ✅ **COMPLETADO - Disclaimer enviado y aprobado**

### 8. Estado del Proyecto
- **Gráfico de promedio mensual histórico:** Problema resuelto ✓
- **Look and feel:** Pendiente de mejoras
- **Carga de datos:** Pendiente de optimización
- **Gestión de usuarios desde la web:** Pendiente de implementación

---

## ACUERDOS Y ACCIONES A SEGUIR

| # | Acción | Responsable | Fecha Compromiso |
|---|--------|-------------|------------------|
| 1 | Enviar texto descriptivo para Grid Cell Price Heatmap | Equipo EMI (Daniel Llarens, Santiago Masiriz, Manuel Tinoco) | Próxima reunión |
| 2 | Enviar texto descriptivo para Historical Monthly Average | Equipo EMI (Daniel Llarens, Santiago Masiriz, Manuel Tinoco) | Próxima reunión |
| 3 | Enviar texto descriptivo para gráfico de Distribución | Equipo EMI (Daniel Llarens, Santiago Masiriz, Manuel Tinoco) | Próxima reunión |
| 4 | Enviar descripción de Congestión (incluyendo cálculo) | Equipo EMI (Daniel Llarens, Santiago Masiriz, Manuel Tinoco) | Próxima reunión |
| 5 | Revisar y definir unidades correctas para cada pantalla | Equipo EMI (Daniel Llarens, Santiago Masiriz, Manuel Tinoco) | Próxima reunión |
| 6 | Incorporar descripciones de eje X | Equipo Desarrollo (Rodrigo Perez, Alberto Pezzi, Alejandro Mina) | Pendiente |
| 7 | Implementar lógica para ocultar gráfico de congestión cuando no sea PRICE | Equipo Desarrollo (Rodrigo Perez, Alberto Pezzi, Alejandro Mina) | Pendiente |
| 8 | Implementar descripciones recibidas en las pantallas | Equipo Desarrollo (Rodrigo Perez, Alberto Pezzi, Alejandro Mina) | Pendiente |
| 9 | Definir política de cobro por exportación de datos | Equipo EMI | Pendiente |
| 10 | Evaluar implementación de capas separadas en el mapa | Equipo Desarrollo (Rodrigo Perez, Alberto Pezzi, Alejandro Mina) | Pendiente |
| 11 | Mostrar información histórica del productor | Equipo Desarrollo (Rodrigo Perez, Alberto Pezzi, Alejandro Mina) | 31 de enero |
| 12 | ~~Elaborar disclaimer legal y de uso de datos~~ | ~~Diego Perdomo~~ | ✅ **COMPLETADO** |
| 13 | ~~Aprobar disclaimer~~ | ~~Equipo EMI + Dirección General~~ | ✅ **COMPLETADO** |

---

## NOTAS ADICIONALES
- Manuel Tinoco mencionó la posibilidad de reprogramar la reunión del grupo de OTEs para el martes por la mañana temprano
- Se continúa trabajando en mejoras de diseño e interfaz de usuario
- Pendiente investigación adicional sobre diseño independiente con enfoque en la experiencia de usuario
- Problema del mapa en blanco fue resuelto durante la sesión ✓
- Problema del gráfico de promedio mensual histórico fue abordado ✓
- Alberto Pezzi se comunicó con Diego Perdomo quien elaboró, envió y obtuvo aprobación del disclaimer legal ✅

---

## PRÓXIMA REUNIÓN
**Fecha:** Por definir  
**Objetivo:** Revisión de descripciones implementadas e información histórica del productor

---

Quedo atento a cualquier comentario o aclaración.

Saludos cordiales,

**Equipo de Desarrollo - Proyecto ERCOT**

---

*Minuta elaborada y enviada el 30 de enero de 2026*
