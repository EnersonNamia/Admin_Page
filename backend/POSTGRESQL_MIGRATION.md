# PostgreSQL Migration Notes

## Changes Made for PostgreSQL

### 1. Database Configuration
- Changed from `mysql2` to `pg` package
- Updated port from 3306 to 5432 (PostgreSQL default)
- Changed user from `root` to `postgres`

### 2. Query Syntax Changes

#### Parameter Placeholders
- **MySQL**: `?` for placeholders
- **PostgreSQL**: `$1, $2, $3` for numbered parameters

Example:
```javascript
// MySQL
await pool.execute('SELECT * FROM users WHERE id = ? AND email = ?', [id, email]);

// PostgreSQL
await pool.query('SELECT * FROM users WHERE id = $1 AND email = $2', [id, email]);
```

#### LIKE vs ILIKE
- **MySQL**: `LIKE` is case-insensitive by default
- **PostgreSQL**: Use `ILIKE` for case-insensitive search

```javascript
// MySQL
query += ` AND (full_name LIKE ? OR email LIKE ?)`;

// PostgreSQL
query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1})`;
```

### 3. Response Objects
- **MySQL with mysql2**: Returns array `[rows, fields]` for queries
  ```javascript
  const [users] = await pool.execute(query, params);
  ```
- **PostgreSQL with pg**: Returns object with `rows` property
  ```javascript
  const result = await pool.query(query, params);
  const users = result.rows;
  ```

### 4. Insert Statements
- **MySQL**: Use `insertId` from result
  ```javascript
  const [result] = await pool.execute('INSERT INTO ... VALUES (...)', [...]);
  const id = result.insertId;
  ```
- **PostgreSQL**: Use `RETURNING` clause
  ```javascript
  const result = await pool.query('INSERT INTO ... VALUES (...) RETURNING id', [...]);
  const id = result.rows[0].id;
  ```

### 5. Row Count Checks
- **MySQL**: `result.affectedRows`
  ```javascript
  if (result.affectedRows === 0) { ... }
  ```
- **PostgreSQL**: `result.rowCount`
  ```javascript
  if (result.rowCount === 0) { ... }
  ```

### 6. Error Codes
- **MySQL**: `ER_DUP_ENTRY` for duplicate key violation
- **PostgreSQL**: `23505` for unique violation

```javascript
// MySQL
if (error.code === 'ER_DUP_ENTRY') { ... }

// PostgreSQL
if (error.code === '23505') { ... }
```

### 7. Transactions
- **MySQL**:
  ```javascript
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    // ... queries
    await connection.commit();
  } catch {
    await connection.rollback();
  } finally {
    connection.release();
  }
  ```
- **PostgreSQL**:
  ```javascript
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // ... queries
    await client.query('COMMIT');
  } catch {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
  ```

### 8. Data Types
- **MySQL**: `ENUM('pending', 'accepted', 'rejected')`
- **PostgreSQL**: VARCHAR with CHECK constraint
  ```sql
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))
  ```

### 9. Auto-increment IDs
- **MySQL**: `INT PRIMARY KEY AUTO_INCREMENT`
- **PostgreSQL**: `SERIAL PRIMARY KEY` or `INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY`

### 10. Timestamps
- **MySQL**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- **PostgreSQL**: Manually update via SQL or triggers
  ```javascript
  // In queries, update updated_at manually or use:
  // CREATE TRIGGER ... BEFORE UPDATE ... SET updated_at = NOW()
  ```

## Routes Still Need Updating

The following routes need to be converted to PostgreSQL syntax:
- `routes/courses.js` - All queries use `?` placeholders
- `routes/tests.js` - Includes transactions that need updating
- `routes/recommendations.js` - Complex queries with joins
- `routes/analytics.js` - Multiple aggregate queries

## Quick Conversion Template

For each route file, follow this pattern:

```javascript
// OLD (MySQL):
const [rows] = await pool.execute('SELECT * FROM table WHERE id = ?', [id]);
const [result] = await pool.execute('INSERT INTO table VALUES (...)', [...]);
if (result.affectedRows === 0) { ... }

// NEW (PostgreSQL):
const queryResult = await pool.query('SELECT * FROM table WHERE id = $1', [id]);
const rows = queryResult.rows;
const result = await pool.query('INSERT INTO table VALUES (...) RETURNING id', [...]);
if (result.rowCount === 0) { ... }
```

## Installation & Setup

1. Install PostgreSQL package:
   ```bash
   npm uninstall mysql2
   npm install pg
   ```

2. Create database:
   ```bash
   createdb course_recommendation_system
   ```

3. Update .env file with PostgreSQL credentials

4. Start the server - tables will be created automatically

## Testing

After conversion, test each endpoint:
- GET endpoints with search and filtering
- POST endpoints with validation
- PUT/UPDATE endpoints
- DELETE endpoints
- Statistics/analytics endpoints