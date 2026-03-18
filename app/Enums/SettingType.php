<?php

declare(strict_types=1);

namespace App\Enums;

enum SettingType: string
{
    case String = 'string';
    case Integer = 'integer';
    case Boolean = 'boolean';
    case Json = 'json';
    case Float = 'float';
}
