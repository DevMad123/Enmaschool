{{-- ===== resources/views/emails/central/welcome-tenant.blade.php ===== --}}
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bienvenue sur Enma School</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; }
        .header { background: #2563eb; padding: 32px 40px; color: #fff; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 32px 40px; color: #374151; line-height: 1.7; }
        .body h2 { color: #1e40af; font-size: 18px; margin-top: 0; }
        .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
        .info-box p { margin: 4px 0; font-size: 14px; }
        .info-box strong { color: #0369a1; }
        .btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { padding: 20px 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Enma School</h1>
        </div>
        <div class="body">
            <h2>Bienvenue, {{ $adminName }} !</h2>
            <p>
                Votre espace scolaire <strong>{{ $tenant->name }}</strong> a été créé
                avec succès sur la plateforme Enma School.
            </p>
            <p>Voici vos informations de connexion :</p>
            <div class="info-box">
                <p><strong>Domaine :</strong> {{ $tenant->slug }}.enmaschool.test</p>
                <p><strong>Email :</strong> {{ $adminEmail }}</p>
                <p><strong>Mot de passe temporaire :</strong> {{ $tempPassword }}</p>
            </div>
            <p>
                Nous vous recommandons de changer votre mot de passe dès votre
                première connexion.
            </p>
            <a class="btn" href="https://{{ $tenant->slug }}.enmaschool.test/login">
                Accéder à mon espace
            </a>
        </div>
        <div class="footer">
            <p>Cet e-mail a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>&copy; {{ date('Y') }} Enma School — Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
