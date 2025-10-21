#!/bin/sh
# entrypoint.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# These variables are passed from docker-compose.yml
# We need to export them so pg_isready can see them
export PGHOST=$POSTGRES_HOST
export PGUSER=$POSTGRES_USER
export PGPASSWORD=$POSTGRES_PASSWORD
export PGDATABASE=$POSTGRES_DB
export PGPORT=$POSTGRES_PORT

echo "Waiting for database to be ready..."

# Wait loop:
# -h $PGHOST: specifies the host (e.g., 'db')
# -p $PGPORT: specifies the port (e.g., '5432')
# -U $PGUSER: specifies the user
# -q: quiet mode (no output)
# We loop until pg_isready returns 0 (success)
while ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -q; do
  sleep 2
done

echo "Database is ready!"

# Run the Drizzle Kit push command
echo "Running database schema push..."
npm run db:push

# Now, execute the main command (start the Nuxt server)
echo "Starting Nuxt server..."
exec "$@"