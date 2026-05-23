# Base de Datos en Railway (Sin Prisma)

Este proyecto utiliza una configuración de base de datos sin Prisma, ideal para Railway.

## Cambios Realizados

### 1. **Schema SQL Puro** 
- Archivo: `lib/db/schema.sql`
- Contiene todas las tablas y relaciones en SQL puro
- Compatible con MySQL 8.0+
- Se ejecuta automáticamente al iniciar la aplicación

### 2. **Inicialización de Base de Datos**
- **Automática**: `lib/db/db-init.ts` se ejecuta al iniciar
- **Manual**: `npm run db:init` ejecuta `scripts/init-db.js`
- No requiere Prisma migrations

### 3. **Scripts Actualizados**

#### Para desarrollo local:
```bash
npm run dev              # Inicia con hot-reload
npm run db:init         # Inicializa la BD manualmente
npm run build           # Build sin Prisma generation
npm run start           # Inicia en producción
```

#### Para Railway:
```bash
npm run start:railway    # Ejecuta init-db.js + next start
# O Railway ejecuta directamente: node scripts/railway-start.sh
```

## Configuración en Railway

### 1. **Variables de Entorno**
Railway proporciona automáticamente:
- `MYSQL_URL` - Connection string de Railway MySQL
- `DATABASE_URL` - Alternativa (si está configurada)

El código soporta ambas.

### 2. **Comando de Arranque**
En Railway, configura:
```bash
sh scripts/railway-start.sh
```

O si Railway ejecuta `npm start`:
```bash
npm run start:railway
```

### 3. **Build Command** (opcional)
```bash
npm run build
```
(Ya no necesita `prisma generate`)

## Estructura de la Aplicación

```
project/
├── lib/
│   ├── db/
│   │   ├── schema.sql        # ← Definición del schema
│   │   └── db-init.ts        # ← Inicializador (usa mysql2)
│   ├── db-init.ts            # ← Re-export para compatibilidad
│   └── prisma.ts             # ← Aún usa PrismaClient para queries
├── scripts/
│   ├── init-db.js            # ← Script independiente de init
│   └── railway-start.sh       # ← Script de arranque para Railway
├── prisma/                    # ← Ya no necesario para migraciones
│   └── schema.prisma          # ← Se puede eliminar después
└── package.json
```

## Prisma: Mantiene funcionalidad

**Important**: PrismaClient sigue siendo usado para las operaciones de datos:
- No se ejecutan migraciones
- Se mantiene la tipificación TypeScript
- Se puede eliminar `@prisma/client` más adelante si se prefiere

Pero el schema ahora viene de `lib/db/schema.sql`, no de Prisma.

## Ventajas de esta Configuración

✅ **Sin dependencias Prisma en el build de Railway**
✅ **Inicialización rápida** - SQL directo sin overhead  
✅ **Compatible con Railway** - Sin necesidad de Docker customizado
✅ **Schema versionable** - Todo en Git
✅ **Compatible con TypeScript** - Aún uses PrismaClient para queries
✅ **Fallback automático** - Si falla init, la app continúa (pero sin schema)

## Troubleshooting

### Error: "No database URL found"
```
→ En Railway, verifica que MySQL esté conectado al servicio
→ Asegúrate que las variables de entorno se exponen correctamente
```

### Error: "Table already exists"
```
→ Esto es normal, se ignora automáticamente
→ Puedes limpiar la BD manualmente si necesitas un reset
```

### Connection timeout
```
→ Verifica que Railway MySQL esté running
→ Aumenta timeout en lib/db/db-init.ts si es necesario
```

## Próximos pasos (Opcional)

1. **Eliminar Prisma completamente** (si no lo necesitas más):
   ```bash
   npm uninstall @prisma/client prisma
   ```
   Y cambiar `lib/prisma.ts` para usar `mysql2` directamente

2. **Añadir seed data**: Crear script `scripts/seed-db.js`

3. **Backups automatizados**: Configurar en Railway dashboard

## Referencias

- [Railway Docs - MySQL](https://docs.railway.app/reference/plugins/mysql)
- [mysql2 Documentation](https://github.com/sidorares/node-mysql2)
- [Next.js Deployment on Railway](https://docs.railway.app/deploy/deployments)
