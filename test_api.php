<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::create('/central/tenants', 'GET');
// Obtenir le token du super admin
$admin = App\Models\Central\SuperAdmin::first();
$token = $admin->createToken('test')->plainTextToken;
$request->headers->set('Authorization', 'Bearer ' . $token);
$request->headers->set('Accept', 'application/json');
$response = $kernel->handle($request);
echo $response->getContent();
$kernel->terminate($request, $response);
