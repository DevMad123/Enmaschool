<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ config('app.name', 'Enma School') }}</title>
    @viteReactRefresh
    @vite(['src/main.tsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
