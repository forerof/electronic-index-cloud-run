# 1. Introducción

Esta guía describe el procedimiento para desplegar el microservicio **Electronic Index Cloud Run** en Google Cloud utilizando **Docker**, **Artifact Registry** y **Cloud Run**.

El documento cubre desde la preparación del entorno hasta la verificación del despliegue, incluyendo la configuración de los servicios necesarios y las pruebas básicas para validar el correcto funcionamiento de la aplicación.

> **Alcance:** Este documento se limita al proceso de despliegue del microservicio. La integración con Google Apps Script y los demás componentes del proyecto Electronic Index se documentan por separado.

# 2. Prerrequisitos

Antes de iniciar el despliegue, asegúrese de contar con los siguientes requisitos:

## Software

- **Git** para clonar el repositorio.
- **Node.js 22 o superior** y **npm** para instalar dependencias y ejecutar el proyecto localmente.
- **Docker Engine** o **Docker Desktop** para construir y probar la imagen del contenedor.
- **Google Cloud CLI (`gcloud`)** instalado y autenticado.

## Cuenta de Google Cloud

Se requiere una cuenta de Google Cloud con, creela o use una existente:

- Un proyecto de Google Cloud.
- Una cuenta de facturación (Billing) asociada al proyecto.
- Permisos para crear y administrar recursos de:
  - Cloud Run.
  - Artifact Registry.
  - Service Usage.

## APIs habilitadas

Las siguientes APIs deben estar habilitadas en el proyecto:

- Cloud Run API (`run.googleapis.com`)
- Artifact Registry API (`artifactregistry.googleapis.com`)

## Conocimientos recomendados

Para facilitar el proceso de despliegue, se recomienda tener conocimientos básicos sobre:

- Docker y contenedores.
- Línea de comandos (CLI).
- Google Cloud Platform (GCP).

# 3. Arquitectura de despliegue

El microservicio **Electronic Index Cloud Run** se distribuye como una imagen Docker almacenada en **Google Artifact Registry** y ejecutada mediante **Google Cloud Run**.

El flujo general de despliegue es el siguiente:

```text
Repositorio Git
       │
       ▼
Código fuente (Node.js)
       │
       ▼
Construcción de la imagen Docker
       │
       ▼
Google Artifact Registry
       │
       ▼
Google Cloud Run
       │
       ▼
Servicio HTTPS
```

## Componentes

| Componente | Descripción |
|------------|-------------|
| Repositorio Git | Almacena el código fuente del microservicio. |
| Docker | Empaqueta la aplicación y todas sus dependencias en una imagen de contenedor. |
| Google Artifact Registry | Repositorio donde se almacenan las imágenes Docker versionadas. |
| Google Cloud Run | Servicio serverless que ejecuta el contenedor bajo demanda. |
| Cliente HTTP | Consumidor del servicio (por ejemplo, Google Apps Script) mediante solicitudes HTTPS. |

## Flujo de despliegue

1. El código fuente se desarrolla y prueba localmente.
2. Se construye una imagen Docker del proyecto.
3. La imagen se publica en Google Artifact Registry.
4. Cloud Run crea una nueva revisión del servicio utilizando la imagen publicada.
5. El servicio queda disponible mediante una URL HTTPS administrada por Google Cloud.

# 4. Configuración del proyecto en Google Cloud

## 4.1 Crear un nuevo proyecto

Si aún no dispone de un proyecto en Google Cloud, cree uno nuevo desde la consola de Google Cloud o mediante la herramienta de línea de comandos (`gcloud`).

```bash
gcloud projects create PROJECT_ID \
    --name="PROJECT_NAME"
```

Donde:

- **PROJECT_ID**: Identificador único del proyecto en Google Cloud.
- **PROJECT_NAME**: Nombre descriptivo que aparecerá en la consola.

> **Nota:** El identificador del proyecto (**PROJECT_ID**) no podrá modificarse posteriormente.

---

## 4.2 Seleccionar el proyecto activo

Una vez creado el proyecto, configúrelo como proyecto activo para todas las operaciones posteriores.

```bash
gcloud config set project PROJECT_ID
```

Verifique la configuración ejecutando:

```bash
gcloud config get-value project
```

La salida debe corresponder al identificador del proyecto configurado.

Ejemplo:

```text
electronic-index-cloud-run
```

---

## 4.3 Verificar la configuración actual

Para consultar la configuración activa del entorno de Google Cloud CLI, ejecute:

```bash
gcloud config list
```

Este comando permite verificar, entre otros aspectos:

- Proyecto activo.
- Cuenta autenticada.
- Región y configuración predeterminada (si existen).

Antes de continuar con el despliegue, confirme que el proyecto activo corresponde al proyecto donde se desplegará el servicio.

# 5. Configurar Billing

Google Cloud Run requiere que el proyecto tenga una **cuenta de facturación (Billing Account)** asociada, incluso cuando el servicio opere completamente dentro del nivel gratuito (*Free Tier*).

## 5.1 Asociar una cuenta de facturación

Si el proyecto aún no tiene una cuenta de facturación asociada, siga estos pasos:

1. Acceda a la consola de Google Cloud.
2. Navegue a **Billing**.
3. Cree una nueva cuenta de facturación o seleccione una existente.
4. Asocie la cuenta de facturación al proyecto de Google Cloud.

> **Importante:** La activación de Billing no implica cargos automáticos. Mientras el consumo permanezca dentro de los límites del nivel gratuito de Cloud Run, no se generarán costos.

---

## 5.2 Verificar la configuración

Para comprobar que el proyecto tiene una cuenta de facturación asociada, ejecute:

```bash
gcloud billing projects describe PROJECT_ID
```

Si la configuración es correcta, la salida será similar a:

```yaml
billingAccountName: billingAccounts/XXXXXXXXXXXXXX
billingEnabled: true
name: projects/PROJECT_ID/billingInfo
projectId: PROJECT_ID
```

También es posible consultar las cuentas de facturación disponibles mediante:

```bash
gcloud billing accounts list
```

---

## 5.3 Configurar un presupuesto (recomendado)

Se recomienda crear un presupuesto con alertas de consumo para monitorear el uso del proyecto y evitar cargos inesperados.

Desde la consola de Google Cloud:

1. Acceda a **Billing**.
2. Seleccione la cuenta de facturación correspondiente.
3. Ingrese a **Budgets & alerts**.
4. Cree un presupuesto para el proyecto.
5. Configure notificaciones de uso (por ejemplo, al 50 %, 90 % y 100 % del presupuesto).

> **Nota:** Las alertas de presupuesto únicamente notifican el consumo; no detienen automáticamente los servicios de Google Cloud.

# 6. Habilitar APIs

Antes de desplegar el microservicio, es necesario habilitar las APIs de Google Cloud utilizadas durante el proceso de construcción, almacenamiento y ejecución del contenedor.

## 6.1 APIs requeridas

El proyecto requiere las siguientes APIs:

| API | Descripción |
|-----|-------------|
| **Cloud Run API** (`run.googleapis.com`) | Permite crear, administrar y ejecutar servicios en Google Cloud Run. |
| **Artifact Registry API** (`artifactregistry.googleapis.com`) | Permite almacenar y administrar imágenes Docker utilizadas por Cloud Run. |

---

## 6.2 Habilitar las APIs

Ejecute el siguiente comando para habilitar ambas APIs en el proyecto activo:

```bash
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com
```

Si la operación finaliza correctamente, las APIs quedarán disponibles para su utilización.

---

## 6.3 Verificar las APIs habilitadas

Para comprobar que las APIs fueron habilitadas correctamente, ejecute:

```bash
gcloud services list --enabled
```

La salida deberá incluir, entre otras, las siguientes APIs:

```text
NAME                                TITLE
artifactregistry.googleapis.com     Artifact Registry API
run.googleapis.com                  Cloud Run Admin API
```

También es posible verificar una API específica utilizando:

```bash
gcloud services list --enabled \
    --filter="NAME:run.googleapis.com"
```

o

```bash
gcloud services list --enabled \
    --filter="NAME:artifactregistry.googleapis.com"
```

---

## 6.4 Solución de problemas

Si durante la habilitación de las APIs aparece un mensaje similar al siguiente:

```text
FAILED_PRECONDITION:
Billing account for project is not found.
```

Verifique que el proyecto tenga una cuenta de facturación asociada antes de continuar con el despliegue. Consulte la sección **5. Configurar Billing** para obtener más información.

# 7. Crear Artifact Registry

Google Artifact Registry es el servicio utilizado para almacenar y administrar las imágenes Docker del proyecto. Cloud Run obtiene las imágenes directamente desde este repositorio durante el despliegue.

## 7.1 Crear un repositorio Docker

Ejecute el siguiente comando para crear un repositorio de tipo Docker:

```bash
gcloud artifacts repositories create REPOSITORY_NAME \
    --repository-format=docker \
    --location=REGION \
    --description="Docker images for Electronic Index Cloud Run"
```

Donde:

- **REPOSITORY_NAME:** Nombre del repositorio.
- **REGION:** Región donde se almacenarán las imágenes (por ejemplo, `us-central1`).

Ejemplo:

```bash
gcloud artifacts repositories create electronic-index \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker images for Electronic Index Cloud Run"
```

---

## 7.2 Verificar el repositorio

Para listar los repositorios existentes en el proyecto:

```bash
gcloud artifacts repositories list
```

La salida deberá mostrar un repositorio similar al siguiente:

```text
REPOSITORY          FORMAT   MODE      LOCATION
electronic-index    DOCKER   STANDARD  us-central1
```

También es posible consultar la información de un repositorio específico:

```bash
gcloud artifacts repositories describe REPOSITORY_NAME \
    --location=REGION
```

---

## 7.3 Configurar la autenticación de Docker

Antes de publicar imágenes, Docker debe autenticarse con Artifact Registry.

Ejecute:

```bash
gcloud auth configure-docker REGION-docker.pkg.dev
```

Ejemplo:

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

Si la configuración es correcta, se mostrará un mensaje indicando que Docker ha sido configurado para autenticarse con Artifact Registry.

---

## 7.4 Verificar la configuración

Para comprobar que Docker fue configurado correctamente, inspeccione el archivo de configuración:

```bash
cat ~/.docker/config.json
```

El archivo deberá contener una entrada similar a:

```json
{
  "credHelpers": {
    "us-central1-docker.pkg.dev": "gcloud"
  }
}
```

Esto indica que Docker utilizará Google Cloud CLI para autenticarse automáticamente al publicar imágenes en Artifact Registry.

# 8. Configurar Docker

Antes de construir y publicar la imagen del contenedor, es necesario verificar que Docker se encuentre correctamente instalado y en ejecución.

## 8.1 Verificar la instalación

Compruebe que Docker está instalado ejecutando:

```bash
docker --version
```

La salida será similar a:

```text
Docker version 28.3.2, build 578ccf6
```

---

## 8.2 Verificar que el servicio está en ejecución

Confirme que el daemon de Docker se encuentra activo:

```bash
docker info
```

Si Docker está funcionando correctamente, el comando mostrará información del servidor, incluyendo el número de contenedores, imágenes y la configuración del motor Docker.

---

## 8.3 Verificar permisos de ejecución

Ejecute el siguiente comando para comprobar que el usuario actual puede utilizar Docker sin privilegios de superusuario:

```bash
docker ps
```

Si el comando devuelve una lista de contenedores (aunque esté vacía), los permisos son correctos.

En caso de obtener un error similar a:

```text
permission denied while trying to connect to the Docker daemon socket
```

agregue el usuario al grupo `docker`:

```bash
sudo usermod -aG docker $USER
```

Posteriormente, cierre la sesión y vuelva a iniciarla para que los cambios surtan efecto.

---

## 8.4 Verificar la autenticación con Google Artifact Registry

Docker debe estar configurado para autenticarse con Google Artifact Registry antes de publicar imágenes.

Ejecute:

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

Si la operación finaliza correctamente, aparecerá un mensaje indicando que la configuración de Docker ha sido actualizada.

---

## 8.5 Verificar la configuración de autenticación

Compruebe que Docker utilizará Google Cloud CLI como proveedor de credenciales:

```bash
cat ~/.docker/config.json
```

El archivo deberá contener una entrada similar a:

```json
{
  "credHelpers": {
    "us-central1-docker.pkg.dev": "gcloud"
  }
}
```

Esta configuración permite que Docker autentique automáticamente las operaciones de publicación (`docker push`) contra Google Artifact Registry.

---

## 8.6 Validación final

Antes de continuar con la construcción de la imagen, verifique que se cumplen las siguientes condiciones:

- Docker se encuentra instalado.
- El servicio de Docker está en ejecución.
- El usuario actual tiene permisos para ejecutar comandos Docker.
- Docker está autenticado correctamente con Google Artifact Registry.

# 9. Construir la imagen

Una vez configurado el entorno de desarrollo y autenticado Docker con Google Artifact Registry, el siguiente paso consiste en construir la imagen Docker del microservicio.

La imagen se genera a partir del archivo `Dockerfile` ubicado en la raíz del proyecto e incluye la aplicación, sus dependencias y la configuración necesaria para su ejecución en Google Cloud Run.

## 9.1 Construir la imagen

Desde la raíz del proyecto, ejecute:

```bash
docker build -t IMAGE_NAME:TAG .
```

Donde:

- **IMAGE_NAME:** Nombre de la imagen Docker.
- **TAG:** Versión de la imagen.

Ejemplo:

```bash
docker build -t electronic-index-cloud-run:v1 .
```

Al finalizar correctamente, Docker mostrará un mensaje similar al siguiente:

```text
Successfully built <IMAGE_ID>
Successfully tagged electronic-index-cloud-run:v1
```

---

## 9.2 Verificar la imagen creada

Para listar las imágenes disponibles en el entorno local:

```bash
docker images
```

La salida deberá incluir una imagen similar a:

```text
REPOSITORY                   TAG    IMAGE ID       CREATED          SIZE
electronic-index-cloud-run   v1     abc123def456   2 minutes ago    109 MB
```

---

## 9.3 Probar la imagen localmente

Antes de publicarla en Google Artifact Registry, se recomienda ejecutar el contenedor de forma local para verificar su funcionamiento.

Ejecute:

```bash
docker run \
    -p 8080:8080 \
    --env-file .env \
    electronic-index-cloud-run:v1
```

Una vez iniciado el contenedor, verifique que el servicio responde correctamente mediante el endpoint de estado:

```bash
curl http://localhost:8080/api/v1/health
```

La respuesta esperada es:

```json
{
    "success": true,
    "message": "Electronic Index PDF Service is running."
}
```

---

## 9.4 Validación final

Antes de continuar con la publicación de la imagen, confirme que:

- La imagen Docker fue construida correctamente.
- La imagen aparece en el listado de imágenes locales.
- El contenedor inicia sin errores.
- El endpoint `GET /api/v1/health` responde correctamente desde el contenedor local.

# 10. Etiquetar la imagen

Una vez construida y validada la imagen Docker localmente, es necesario asignarle una etiqueta compatible con Google Artifact Registry. Esta etiqueta indica el repositorio de destino, la región, el nombre de la imagen y la versión que será publicada.

## 10.1 Formato de la etiqueta

La sintaxis utilizada por Google Artifact Registry es la siguiente:

```text
REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY_NAME/IMAGE_NAME:TAG
```

Donde:

| Parámetro | Descripción |
|-----------|-------------|
| **REGION** | Región donde se encuentra el repositorio de Artifact Registry. |
| **PROJECT_ID** | Identificador único del proyecto de Google Cloud. |
| **REPOSITORY_NAME** | Nombre del repositorio Docker creado en Artifact Registry. |
| **IMAGE_NAME** | Nombre asignado a la imagen del contenedor. |
| **TAG** | Versión de la imagen. |

---

## 10.2 Etiquetar la imagen

Ejecute el siguiente comando:

```bash
docker tag \
    IMAGE_NAME:TAG \
    REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY_NAME/IMAGE_NAME:TAG
```

Ejemplo:

```bash
docker tag \
    electronic-index-cloud-run:v1 \
    us-central1-docker.pkg.dev/electronic-index-cloud-run/electronic-index/electronic-index-cloud-run:v1
```

Este comando no crea una nueva imagen; únicamente agrega una nueva referencia (tag) a la imagen existente.

---

## 10.3 Verificar las etiquetas

Para comprobar que la imagen posee ambas etiquetas, ejecute:

```bash
docker images
```

La salida será similar a:

```text
REPOSITORY                                                                    TAG    IMAGE ID       CREATED        SIZE
electronic-index-cloud-run                                                    v1     abc123def456   5 minutes ago  109 MB
us-central1-docker.pkg.dev/electronic-index-cloud-run/electronic-index/
electronic-index-cloud-run                                                    v1     abc123def456   5 minutes ago  109 MB
```

Observe que ambas referencias apuntan al mismo **IMAGE ID**, lo que confirma que corresponden a la misma imagen Docker.

---

## 10.4 Validación final

Antes de continuar con la publicación en Google Artifact Registry, verifique que:

- La imagen local existe.
- La imagen tiene una etiqueta con el formato requerido por Google Artifact Registry.
- Ambas etiquetas apuntan al mismo `IMAGE ID`.
- La versión (`TAG`) corresponde a la versión que se desea publicar.

# 11. Publicar la imagen

Una vez que la imagen ha sido etiquetada correctamente, el siguiente paso consiste en publicarla en **Google Artifact Registry**. A partir de este momento, la imagen estará disponible para ser utilizada durante el despliegue del servicio en Google Cloud Run.

## 11.1 Publicar la imagen

Ejecute el siguiente comando para enviar la imagen al repositorio de Artifact Registry:

```bash
docker push \
    REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY_NAME/IMAGE_NAME:TAG
```

Ejemplo:

```bash
docker push \
    us-central1-docker.pkg.dev/electronic-index-cloud-run/electronic-index/electronic-index-cloud-run:v1
```

Durante la publicación, Docker mostrará el progreso de cada una de las capas que componen la imagen. Una vez finalizada la operación, se visualizará un resultado similar al siguiente:

```text
The push refers to repository [us-central1-docker.pkg.dev/electronic-index-cloud-run/electronic-index/electronic-index-cloud-run]

...

v1: digest: sha256:0d6491503952b89f73ef8fac13048763f6dc7a3af3933805e30429addd33c8b1
```

La aparición del **digest SHA256** confirma que la imagen fue publicada correctamente y permite identificarla de manera única.

---

## 11.2 Verificar la imagen publicada

Para listar las imágenes almacenadas en el repositorio, ejecute:

```bash
gcloud artifacts docker images list \
    REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY_NAME
```

Ejemplo:

```bash
gcloud artifacts docker images list \
    us-central1-docker.pkg.dev/electronic-index-cloud-run/electronic-index
```

La salida mostrará las imágenes disponibles junto con su versión, fecha de publicación y digest.

También es posible verificar la imagen desde la consola de Google Cloud:

1. Acceda a **Artifact Registry**.
2. Seleccione el repositorio correspondiente.
3. Abra la pestaña **Imágenes**.
4. Compruebe que la imagen publicada aparece con la etiqueta (`TAG`) esperada.

---

## 11.3 Validación final

Antes de continuar con el despliegue en Cloud Run, verifique que:

- La imagen fue publicada correctamente en Google Artifact Registry.
- La etiqueta (`TAG`) corresponde a la versión que se desea desplegar.
- El **digest SHA256** fue generado correctamente.
- La imagen es visible tanto desde la línea de comandos como desde la consola de Google Cloud.

# 12. Crear el servicio Cloud Run

Una vez que la imagen Docker ha sido publicada en Google Artifact Registry, el siguiente paso consiste en crear el servicio en **Google Cloud Run**.

Cloud Run desplegará una nueva revisión del servicio utilizando la imagen especificada y la expondrá mediante una URL HTTPS administrada por Google Cloud.

---

## 12.1 Desplegar el servicio

Ejecute el siguiente comando:

```bash
gcloud run deploy SERVICE_NAME \
    --image REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY_NAME/IMAGE_NAME:TAG \
    --region REGION \
    --memory 512Mi \
    --cpu 1 \
    --timeout 30 \
    --max-instances 1
```

Ejemplo:

```bash
gcloud run deploy electronic-index-pdf-service \
    --image us-central1-docker.pkg.dev/electronic-index-cloud-run/electronic-index/electronic-index-cloud-run:v1 \
    --region us-central1 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 30 \
    --max-instances 1
```

Durante el despliegue, Cloud Run solicitará confirmar si el servicio permitirá invocaciones sin autenticación:

```text
Allow unauthenticated invocations to [electronic-index-pdf-service] (y/N)?
```

Para este proyecto, responda:

```text
Y
```

Una vez finalizado el despliegue, se mostrará un resultado similar al siguiente:

```text
Deploying container to Cloud Run service...

✓ Deploying new service... Done.
✓ Creating Revision...
✓ Routing traffic...
✓ Setting IAM Policy...

Done.

Service URL:
https://SERVICE_NAME-PROJECT_NUMBER.REGION.run.app
```

---

## 12.2 Explicación de los parámetros

| Parámetro | Descripción |
|-----------|-------------|
| `--image` | Imagen Docker almacenada en Google Artifact Registry. |
| `--region` | Región donde se desplegará el servicio. |
| `--memory` | Memoria asignada a cada instancia del contenedor. |
| `--cpu` | Número de CPU disponibles por instancia. |
| `--timeout` | Tiempo máximo permitido para procesar una solicitud. |
| `--max-instances` | Número máximo de instancias que Cloud Run puede crear automáticamente. |

---

## 12.3 Verificar el servicio

Para listar los servicios desplegados:

```bash
gcloud run services list
```

La salida será similar a:

```text
SERVICE                           REGION        URL
electronic-index-pdf-service      us-central1   https://...
```

También es posible obtener información detallada del servicio:

```bash
gcloud run services describe SERVICE_NAME \
    --region REGION
```

Ejemplo:

```bash
gcloud run services describe electronic-index-pdf-service \
    --region us-central1
```

---

## 12.4 Verificar desde la consola de Google Cloud

También puede comprobar el despliegue desde la consola web:

1. Acceda a **Cloud Run**.
2. Seleccione el proyecto correspondiente.
3. Verifique que el servicio aparece en el listado.
4. Abra el servicio para consultar:
   - URL pública.
   - Revisiones desplegadas.
   - Configuración.
   - Variables de entorno.
   - Métricas.
   - Registros (Logs).

---

## 12.5 Consideraciones sobre el nivel gratuito

Con el fin de minimizar el consumo de recursos y mantenerse dentro del nivel gratuito de Cloud Run, este proyecto utiliza la siguiente configuración:

| Configuración | Valor |
|--------------|-------|
| CPU | 1 |
| Memoria | 512 MiB |
| Timeout | 30 segundos |
| Máximo de instancias | 1 |

Esta configuración permite procesar solicitudes de manera eficiente mientras limita el escalado automático y reduce el riesgo de generar costos inesperados.

---

## 12.6 Validación final

Antes de continuar con la configuración del servicio, verifique que:

- El despliegue finalizó sin errores.
- El servicio aparece en el listado de Cloud Run.
- Se generó una URL HTTPS para el servicio.
- La imagen desplegada corresponde a la versión esperada.
- La configuración de memoria, CPU y número máximo de instancias es la definida para el proyecto.

# 13. Configurar variables de entorno

El microservicio utiliza variables de entorno para almacenar información de configuración y datos sensibles. Este enfoque evita incluir valores confidenciales en el código fuente y facilita la configuración de diferentes entornos de ejecución.

En el despliegue sobre Google Cloud Run, las variables de entorno se almacenan como parte de la configuración del servicio.

---

## 13.1 Variables utilizadas

La siguiente tabla describe las variables de entorno requeridas por el servicio.

| Variable | Descripción | Ejemplo |
|----------|-------------|----------|
| `API_KEY` | Clave utilizada para autenticar las solicitudes al endpoint protegido. | `my-secret-api-key` |
| `PORT` | Puerto utilizado por el servidor Express. Cloud Run lo asigna automáticamente durante la ejecución. | `8080` |
| `NODE_ENV` | Define el entorno de ejecución de Node.js. | `production` |
| `MAX_FILE_SIZE` | Tamaño máximo permitido para los archivos PDF recibidos. | `20mb` |

> **Nota:** En Google Cloud Run la variable `PORT` es suministrada automáticamente por la plataforma. No es necesario configurarla manualmente.

---

## 13.2 Configurar variables durante el despliegue

Las variables pueden definirse durante la creación del servicio utilizando el parámetro `--set-env-vars`.

Ejemplo:

```bash
gcloud run deploy electronic-index-pdf-service \
    --image us-central1-docker.pkg.dev/PROJECT_ID/REPOSITORY_NAME/IMAGE_NAME:TAG \
    --region us-central1 \
    --set-env-vars API_KEY=my-secret-api-key,MAX_FILE_SIZE=20mb,NODE_ENV=production
```

---

## 13.3 Actualizar variables de un servicio existente

Si el servicio ya se encuentra desplegado, las variables pueden modificarse mediante:

```bash
gcloud run services update electronic-index-pdf-service \
    --region us-central1 \
    --update-env-vars API_KEY=my-secret-api-key
```

Es posible actualizar varias variables simultáneamente separándolas por comas.

Ejemplo:

```bash
gcloud run services update electronic-index-pdf-service \
    --region us-central1 \
    --update-env-vars API_KEY=my-secret-api-key,MAX_FILE_SIZE=20mb,NODE_ENV=production
```

Cada actualización genera automáticamente una nueva revisión (*Revision*) del servicio.

---

## 13.4 Verificar la configuración

Para consultar las variables de entorno configuradas en el servicio, ejecute:

```bash
gcloud run services describe electronic-index-pdf-service \
    --region us-central1
```

La salida incluirá una sección similar a:

```yaml
env:
- name: API_KEY
  value: my-secret-api-key
- name: MAX_FILE_SIZE
  value: 20mb
- name: NODE_ENV
  value: production
```

Las variables también pueden visualizarse desde la consola de Google Cloud:

1. Acceda a **Cloud Run**.
2. Seleccione el servicio.
3. Abra la pestaña **Variables y secretos** (*Variables & Secrets*).

---

## 13.5 Buenas prácticas

- No almacene valores sensibles directamente en el código fuente.
- No incluya archivos `.env` en el repositorio Git.
- Utilice valores diferentes para los entornos de desarrollo y producción.
- Mantenga la `API_KEY` privada y reemplácela periódicamente si se sospecha que ha sido comprometida.

> **Recomendación:** Para aplicaciones empresariales o con múltiples servicios, se recomienda almacenar los secretos mediante **Google Secret Manager**. En este proyecto se utiliza una variable de entorno debido a la simplicidad del servicio y a que resulta suficiente para el nivel de seguridad requerido.

# 14. Verificación del despliegue

Una vez desplegado el servicio y configuradas las variables de entorno, se recomienda realizar una serie de pruebas para comprobar que el servicio funciona correctamente y que está listo para ser consumido por aplicaciones cliente.

---

## 14.1 Verificar el endpoint de estado

El endpoint `/api/v1/health` permite comprobar que el servicio está disponible y respondiendo correctamente.

Ejecute:

```bash
curl https://SERVICE_URL/api/v1/health
```

Ejemplo:

```bash
curl https://electronic-index-pdf-service-878161498117.us-central1.run.app/api/v1/health
```

La respuesta esperada es:

```json
{
    "success": true,
    "message": "Electronic Index PDF Service is running."
}
```

Una respuesta HTTP **200 OK** indica que el servicio se encuentra operativo.

---

## 14.2 Verificar la autenticación mediante API Key

El endpoint `/api/v1/pdf/info` requiere una API Key válida.

Realice una petición sin incluir la cabecera `X-API-Key`:

```bash
curl \
-X POST \
-H "Content-Type: application/pdf" \
--data-binary "@document.pdf" \
https://SERVICE_URL/api/v1/pdf/info
```

La respuesta esperada es:

```http
HTTP/1.1 401 Unauthorized
```

o un cuerpo JSON similar a:

```json
{
    "success": false,
    "error": "Unauthorized"
}
```

Esta prueba confirma que el middleware de autenticación está funcionando correctamente.

---

## 14.3 Procesar un documento PDF

Realice una petición utilizando una API Key válida.

```bash
curl \
-X POST \
-H "Content-Type: application/pdf" \
-H "X-API-Key: YOUR_API_KEY" \
--data-binary "@document.pdf" \
https://SERVICE_URL/api/v1/pdf/info
```

La respuesta esperada es:

```json
{
    "success": true,
    "data": {
        "pages": 12
    }
}
```

Una respuesta HTTP **200 OK** confirma que:

- La autenticación fue exitosa.
- El documento PDF fue recibido correctamente.
- El servicio procesó el archivo utilizando `pdf-parse`.
- El número de páginas fue obtenido correctamente.

---

## 14.4 Verificar los registros (Logs)

Cloud Run registra automáticamente todas las solicitudes y eventos del servicio.

Para consultar los registros desde la línea de comandos:

```bash
gcloud run services logs read electronic-index-pdf-service \
    --region us-central1
```

También pueden visualizarse desde la consola de Google Cloud:

1. Acceda a **Cloud Run**.
2. Seleccione el servicio.
3. Abra la pestaña **Logs**.

Se recomienda verificar que:

- No existan errores durante el inicio del contenedor.
- No existan excepciones inesperadas.
- Las solicitudes sean procesadas correctamente.

---

## 14.5 Verificar las métricas

Cloud Run recopila automáticamente métricas sobre el funcionamiento del servicio.

Desde la consola de Google Cloud, acceda a:

**Cloud Run → electronic-index-pdf-service → Metrics**

Entre las métricas disponibles se encuentran:

- Número de solicitudes.
- Tiempo de respuesta.
- Utilización de CPU.
- Consumo de memoria.
- Número de instancias activas.

Estas métricas permiten supervisar el comportamiento del servicio y detectar posibles problemas de rendimiento.

---

## 14.6 Lista de verificación

Antes de considerar el despliegue como exitoso, confirme que se cumplen las siguientes condiciones:

- El servicio aparece como **Healthy** en Cloud Run.
- El endpoint `GET /api/v1/health` responde con **HTTP 200**.
- El endpoint `POST /api/v1/pdf/info` devuelve **HTTP 401** cuando la API Key es inválida o no se proporciona.
- El endpoint `POST /api/v1/pdf/info` procesa correctamente un documento PDF cuando la API Key es válida.
- No existen errores críticos en los registros del servicio.
- Las métricas de Cloud Run muestran un funcionamiento normal del servicio.

# 15. Solución de problemas

A continuación se presentan algunos de los problemas más comunes durante el proceso de despliegue y sus posibles soluciones.

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| `FAILED_PRECONDITION: Billing account is not found.` | El proyecto no tiene una cuenta de facturación asociada. | Asociar una cuenta de Billing al proyecto y volver a habilitar las APIs. |
| `permission denied while trying to connect to the Docker daemon socket` | El usuario no tiene permisos para utilizar Docker. | Agregar el usuario al grupo `docker` y reiniciar la sesión. |
| `docker push: denied` | Docker no está autenticado con Artifact Registry. | Ejecutar `gcloud auth configure-docker REGION-docker.pkg.dev`. |
| `401 Unauthorized` | API Key ausente o incorrecta. | Verificar la variable `API_KEY` y la cabecera `X-API-Key`. |
| `413 Payload Too Large` | El archivo supera el tamaño máximo permitido. | Reducir el tamaño del PDF o aumentar `MAX_FILE_SIZE`. |
| `415 Unsupported Media Type` | El contenido enviado no corresponde a un PDF. | Enviar el archivo utilizando `Content-Type: application/pdf`. |
| `500 Internal Server Error` | Error inesperado durante el procesamiento del PDF. | Revisar los logs del servicio en Cloud Run. |

---

# 16. Configuración utilizada

La siguiente configuración corresponde al despliegue de referencia realizado para este proyecto.

| Parámetro | Valor |
|-----------|-------|
| Proyecto | `electronic-index-cloud-run` |
| Servicio | `electronic-index-pdf-service` |
| Plataforma | Google Cloud Run |
| Región | `us-central1` |
| Runtime | Node.js |
| Framework | Express.js |
| Contenedor | Docker |
| Registro de imágenes | Google Artifact Registry |
| Repositorio Docker | `electronic-index` |
| Memoria | 512 MiB |
| CPU | 1 vCPU |
| Timeout | 30 segundos |
| Máximo de instancias | 1 |
| Autenticación | API Key |
| Endpoint de estado | `/api/v1/health` |
| Endpoint principal | `/api/v1/pdf/info` |

---

# 17. Próximos pasos

Una vez completado el despliegue del microservicio, las siguientes actividades corresponden a la integración con el resto del proyecto **Electronic Index**.

- Implementar el cliente HTTP en Google Apps Script.
- Enviar documentos PDF desde Google Drive a Cloud Run.
- Procesar múltiples documentos de forma secuencial.
- Registrar automáticamente el número de páginas en Google Sheets.
- Implementar la detección automática de nuevos documentos en Google Drive.
- Desarrollar la interfaz web para la configuración de nuevos usuarios.
- Sincronizar la información generada por múltiples usuarios en una hoja de cálculo centralizada.
- Incorporar monitoreo, métricas y alertas para el servicio en producción.

Con estas actividades, el microservicio quedará completamente integrado dentro del flujo de procesamiento del proyecto **Electronic Index**, permitiendo automatizar la extracción de metadatos de documentos PDF desde Google Apps Script.
