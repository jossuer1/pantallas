# Happy Pay Display

Panel y reproductor de señalización digital con React, Vite, JavaScript, CSS y Lucide. La configuración vive en el almacenamiento local del navegador y se puede trasladar mediante JSON. Cada origen (protocolo, dominio y puerto) tiene su propia configuración.

## Desarrollo

Requiere Node.js 22 o superior y npm. En PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Abre la URL que imprime Vite. El panel está en `/` y el reproductor en `/display`. Para una prueba inicial del iframe, pulsa **Probar inserción** en el panel vacío. Para probar Microsoft usa la versión publicada por HTTPS.

## Configurar informes privados

1. En Power BI Service, abre **Archivo → Insertar informe → Sitio web o portal** y copia la URL segura del cuadro de diálogo o el atributo `src` del iframe. La cuenta que abra el informe debe tener permisos y la licencia correspondiente. [Inserción segura de Power BI](https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-embed-secure).
2. En Excel, usa un `src` HTTPS de inserción que tu organización autorice para el libro de SharePoint o OneDrive empresarial. Conserva los permisos para usuarios autorizados. La guía de inserción para blogs de Microsoft describe acceso anónimo, por lo que sus pasos de publicación no sirven para este caso. Un enlace común de uso compartido puede abrir el libro directamente y aun así quedar bloqueado dentro de un iframe. [Guía de inserción de Excel](https://support.microsoft.com/es-es/excel/embed-your-excel-workbook-on-your-web-page-or-blog-from-sharepoint-or-onedrive-for-business).
3. En el panel, indica nombre, tipo, URL y duración. Configura la recarga periódica en segundos o usa 0 para desactivarla. Pulsa **Vista previa** y comprueba visualmente el contenido. Pulsa **Guardar** para registrar el informe, luego ajusta el orden y el estado en la lista.
4. Para páginas web, usa direcciones HTTPS de sitios que permitan su inserción. Usa únicamente direcciones que correspondan al contenido que tu empresa autoriza mostrar. Exporta el JSON solo a destinos autorizados, pues incluye nombres y enlaces internos. Usa enlaces de inserción que no incluyan credenciales, tokens o firmas.

## Despliegue

### Sincronización con Supabase en Render

1. Si ya tienes una lista local, expórtala desde el panel antes de habilitar Supabase.
2. Crea un proyecto en Supabase. Abre **SQL Editor** y ejecuta `supabase/setup.sql` y luego `supabase/pairing-six-digits.sql`. Si ya tienes una instalación de Happy Pay Display, ejecuta únicamente la segunda consulta para actualizar la vinculación.
3. En **Authentication → Users**, crea el usuario administrador con correo y contraseña. Ejecuta la última consulta del archivo SQL por separado, sustituyendo `TU_CORREO` por ese correo. Para confirmar que el usuario quedó autorizado, comprueba que la consulta insertó una fila en `happy_pay_private.admins`.
4. En **Environment** del sitio estático de Render, agrega `VITE_SUPABASE_URL` con la URL HTTPS del proyecto y `VITE_SUPABASE_PUBLISHABLE_KEY` con la clave **Publishable**. Vite incluye estas dos variables en la compilación del navegador. Usa exclusivamente el tipo de clave Publishable. Guarda y vuelve a compilar y desplegar el sitio. Mantén la regla **Rewrite** de `/*` a `/index.html`.
5. Abre el panel publicado, inicia sesión e importa el JSON si ya tenías informes. En **Vincular pantalla**, genera el código. Abre la URL del sitio con `/display` en la LG e introdúcelo una vez.
6. Modifica la duración de un informe desde el panel y comprueba que la TV reciba la actualización. La consulta se repite cada 15 segundos. Cierra y vuelve a abrir el navegador de la LG para comprobar que conserva la vinculación.

El código tiene seis dígitos, dura cinco minutos y se invalida después de usarlo o tras cinco intentos incorrectos. Genera un código nuevo por cada TV y vincúlalas de una en una. Cada TV guarda su propia credencial de solo lectura hasta un año en una cookie HTTPS limitada a `/display`. Las pantallas vinculadas reproducen la misma lista y conservan su acceso al agregar otra. Los tokens de la sesión administrativa se mantienen en memoria y la autenticación de los informes sigue a cargo de Microsoft.

Si Supabase deja de responder durante la reproducción, la TV conserva la última lista recibida mientras la página siga abierta y reintenta la sincronización. Con ambas variables ausentes, la app funciona en modo local. Si ya vinculaste la pantalla, borrar los datos del navegador requiere vincularla de nuevo.

### Despliegue en Netlify

Conecta el repositorio desde Netlify y despliega la rama del proyecto. El archivo `netlify.toml` indica el comando, el directorio `dist` y la reescritura SPA que permite acceder directamente a `/display`. También puedes compilar localmente y desplegar la carpeta `dist` mediante Netlify CLI desde el proyecto (`netlify deploy --prod --dir=dist`) para aplicar la configuración de rutas. Verifica en Netlify que el dominio use HTTPS.

## Validación en la LG

1. Publica por HTTPS. En la computadora, prueba primero un informe Power BI y un libro Excel reales, con la cuenta autorizada. Confirma que se vean datos y verifica que una cuenta sin permisos no tenga acceso al contenido.
2. Abre el mismo dominio en el navegador de la TV. Importa el archivo JSON si el navegador dispone de selector de archivos o pega su contenido como texto. Si el mando dificulta la importación, da de alta un informe de cada tipo directamente en la TV.
3. Repite la vista previa con cada informe. Comprueba que permiten iniciar sesión y que puedes ver contenido tras completar el inicio de sesión y MFA cuando corresponda. Prueba la inserción local con el panel vacío para distinguir problemas del reproductor de restricciones del proveedor.
4. Activa dos informes con duraciones distintas y un tercero desactivado. Abre **Modo televisión**, espera dos ciclos y verifica orden y duración. Pulsa izquierda o derecha para cambiar de informe y OK para solicitar pantalla completa mientras el foco esté en el reproductor. Si entraste en el iframe, el navegador o el contenido pueden capturar esas teclas.
5. Prueba una recarga por intervalo. Recarga la propia ruta y comprueba que empieza por el último informe activo. Desconecta y restablece la red y verifica que el reproductor retome la rotación. Cierra y reabre el navegador para verificar el comportamiento real del almacenamiento y del inicio de sesión.
6. Comprueba que se ocupa toda el área del navegador y que las páginas se leen bien en 1080p y 4K. Si el televisor rechaza pantalla completa, el reproductor sigue ocupando toda el área de la página.

## Límites de compatibilidad

- La compilación incluye una variante para Chromium 38 o posterior. La versión de webOS, el motor de la LG y su comportamiento real pueden variar. [Motores de webOS TV](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine).
- Power BI y Excel pueden exigir un navegador admitido, cookies, ventanas emergentes, MFA o acceso condicional. El navegador puede disparar el evento de carga incluso para una página bloqueada o de inicio de sesión. El reproductor puede mostrar avisos de demora, errores reportados por el navegador y pérdidas de conexión detectadas, pero la comprobación del contenido privado es visual. [Requisitos de la inserción segura](https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-embed-secure).
- Si Power BI falla en la inserción segura, las opciones oficiales incluyen el elemento web de Power BI en SharePoint Online y una integración **Embed for your organization** con Microsoft Entra ID. Para Excel, abre el libro en Excel para la Web o utiliza las opciones de visualización de SharePoint que apruebe el administrador. Si el navegador de la TV no puede autenticarse, usa un dispositivo con navegador compatible cuando tu organización lo permita. [Power BI en SharePoint Online](https://learn.microsoft.com/en-us/power-bi/collaborate-share/office-integration/service-embed-report-spo) · [Inserción para la organización](https://learn.microsoft.com/en-us/power-bi/guidance/powerbi-implementation-planning-usage-scenario-embed-for-your-organization).
