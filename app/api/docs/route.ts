export const dynamic = 'force-dynamic'

function buildSwaggerHtml(origin: string) {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pokemon Project API Docs</title>
    <link rel="stylesheet" href="${origin}/swagger-ui/swagger-ui.css" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #f7f8fb;
      }

      body {
        font-family: Arial, sans-serif;
      }

      .topbar {
        display: none;
      }

      #swagger-ui {
        max-width: 1400px;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${origin}/swagger-ui/swagger-ui-bundle.js"></script>
    <script src="${origin}/swagger-ui/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: '${origin}/api/openapi',
          dom_id: '#swagger-ui',
          deepLinking: true,
          displayRequestDuration: true,
          defaultModelsExpandDepth: 1,
          docExpansion: 'list',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: 'BaseLayout'
        });
      };
    </script>
  </body>
</html>`
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  return new Response(buildSwaggerHtml(origin), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
