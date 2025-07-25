```markdown
# JavaScript Client Library
## @supabase/supabase-js
[View on GitHub](https://github.com/supabase/supabase-js)

This reference documents every object and method available in Supabase's isomorphic JavaScript library, supabase-js. You can use supabase-js to interact with your Postgres database, listen to database changes, invoke Deno Edge Functions, build login and user management functionality, and manage large files.

To convert SQL queries to supabase-js calls, use the [SQL to REST API translator](https://supabase.com/docs/reference/javascript/sql-to-api).

---
## Installing
### Install as package.
You can install `@supabase/supabase-js` via the terminal.

<Tabs scrollable-buttons="auto"
  size="small"
  type="underlined"
  defaultActiveId="npm"
  queryGroup="install-package-manager"
>
  <Tab id="npm" label="npm">
    ```bash
    npm install @supabase/supabase-js
    ```
  </Tab>
  <Tab id="Yarn" label="Yarn">
    ```bash
    yarn add @supabase/supabase-js
    ```
  </Tab>
  <Tab id="pnpm" label="pnpm">
    ```bash
    pnpm add @supabase/supabase-js
    ```
  </Tab>
</Tabs>

### Install via CDN.
You can install `@supabase/supabase-js` via CDN links.

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//or
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

### Use at runtime in Deno.
You can use `supabase-js` in the Deno runtime via JSR:

```ts
import { createClient } from 'npm:@supabase/supabase-js@2'
```

---
## Initializing
Create a new client for use in the browser.

You can initialize a new Supabase client using the `createClient()` method.

The Supabase client is your entrypoint to the rest of the Supabase functionality and is the easiest way to interact with everything we offer within the Supabase ecosystem.

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `supabaseUrl` | Required | string | The unique Supabase URL which is supplied when you create a new project in your project dashboard. |
| `supabaseKey` | Required | string | The unique Supabase Key which is supplied when you create a new project in your project dashboard. |
| `options` | Optional | SupabaseClientOptions |

<Details>
  <Summary>Details</Summary>
  <div>
    - [Creating a client.](#creating-a-client)
    - [With a custom domain.](#with-a-custom-domain)
    - [With additional parameters.](#with-additional-parameters)
    - [With custom schemas.](#with-custom-schemas)
    - [Custom fetch implementation.](#custom-fetch-implementation)
    - [React Native options with AsyncStorage.](#react-native-options-with-asyncstorage)
    - [React Native options with Expo SecureStore.](#react-native-options-with-expo-securestore)
  </div>
</Details>

```ts
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database.
const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
```

---
## TypeScript support
`supabase-js` has TypeScript support for type inference, autocompletion, type-safe queries, and more.

With TypeScript, `supabase-js` detects things like `not null` constraints and generated columns. Nullable columns are typed as `T | null` when you select the column. Generated columns will show a type error when you insert to it.

`supabase-js` also detects relationships between tables. A referenced table with a one-to-many relationship is typed as `T[]`. Likewise, a referenced table with a many-to-one relationship is typed as `T | null`.

### Generating TypeScript Types.
You can use the Supabase CLI to generate the types. You can also generate the types from the dashboard.

```bash
supabase gen types typescript --project-id abcdefghijklmnopqrst > database.types.ts
```

These types are generated from your database schema. Given a table `public.movies`, the generated types will look like:

```sql
create table public.movies (
  id bigint generated always as identity primary key,
  name text not null,
  data jsonb null
);
```
```ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {               // the data expected from .select().
          id: number
          name: string
          data: Json | null
        }
        Insert: {            // the data to be passed to .insert().
          id?: never         // generated columns must not be supplied.
          name: string       // `not null` columns with no default must be supplied.
          data?: Json | null // nullable columns can be omitted.
        }
        Update: {            // the data to be passed to .update().
          id?: never
          name?: string      // `not null` columns are optional on .update().
          data?: Json | null
        }
      }
    }
  }
}
```

### Using TypeScript type definitions.
You can supply the type definitions to `supabase-js` like so:

```ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
```

### Helper types for Tables and Joins.
You can use the following helper types to make the generated TypeScript types easier to use.

Sometimes the generated types are not what you expect. For example, a view's column may show up as nullable when you expect it to be not null. Using `type-fest`, you can override the types like so:

```ts
export type Json = // ...
export interface Database {
  // ...
}

import { MergeDeep } from 'type-fest'
import { Database as DatabaseGenerated } from './database-generated.types'
export { Json } from './database-generated.types'

// Override the type for a specific column in a view:
export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Views: {
        movies_view: {
          Row: {
            // id is a primary key in public.movies, so it must be `not null`.
            id: number
          }
        }
      }
    }
  }
>
```

You can also override the type of an individual successful response if needed:

```ts
// Partial type override allows you to only override some of the properties in your results.
const { data } = await supabase.from('countries').select().overrideTypes<Array<{ id: string }>>()

// For a full replacement of the original return type, use the `{ merge: false }` property as a second argument.
const { data } = await supabase
  .from('countries')
  .select()
  .overrideTypes<Array<{ id: string }>, { merge: false }>()

// Use it with `maybeSingle` or `single`.
const { data } = await supabase.from('countries').select().single().overrideTypes<{ id: string }>()
```

The generated types provide shorthands for accessing tables and enums.

```ts
import { Database, Tables, Enums } from "./database.types.ts";

// Before 😕
let movie: Database['public']['Tables']['movies']['Row'] = // ...

// After 😍
let movie: Tables<'movies'>
```

### Response types for complex queries.
`supabase-js` always returns a `data` object (for success), and an `error` object (for unsuccessful requests).

These helper types provide the result types from any query, including nested types for database joins.

Given the following schema with a relation between `cities` and `countries`, we can get the nested `CountriesWithCities` type:

```sql
create table countries (
  "id" serial primary key,
  "name" text
);

create table cities (
  "id" serial primary key,
  "name" text,
  "country_id" int references "countries"
);
```
```ts
import { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'

const countriesWithCitiesQuery = supabase
  .from("countries")
  .select(`
    id,
    name,
    cities (
      id,
      name
    )
  `);

type CountriesWithCities = QueryData<typeof countriesWithCitiesQuery>;

const { data, error } = await countriesWithCitiesQuery;

if (error) throw error;

const countriesWithCities: CountriesWithCities = data;
```

---
## Fetch data
Perform a `SELECT` query on the table or view.

> By default, Supabase projects return a maximum of 1,000 rows. This setting can be changed in your project's API settings. It's recommended that you keep it low to limit the payload size of accidental or malicious requests. You can use `range()` queries to paginate through your data.

- `select()` can be combined with [Filters](#using-filters).
- `select()` can be combined with [Modifiers](#using-modifiers).
- `apikey` is a reserved keyword if you're using the Supabase Platform and should be avoided as a column name.

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `columns` | Optional | Query | The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`. |
| `options` | Required | object | Named parameters. |

<Details>
  <Summary>Details</Summary>
  <div>
    - [Getting your data.](#getting-your-data)
    - [Selecting specific columns.](#selecting-specific-columns)
    - [Query referenced tables.](#query-referenced-tables)
    - [Query referenced tables with spaces in their names.](#query-referenced-tables-with-spaces-in-their-names)
    - [Query referenced tables through a join table.](#query-referenced-tables-through-a-join-table)
    - [Query the same referenced table multiple times.](#query-the-same-referenced-table-multiple-times)
    - [Query nested foreign tables through a join table.](#query-nested-foreign-tables-through-a-join-table)
    - [Filtering through referenced tables.](#filtering-through-referenced-tables)
    - [Querying referenced table with count.](#querying-referenced-table-with-count)
    - [Querying with count option.](#querying-with-count-option)
    - [Querying JSON data.](#querying-json-data)
    - [Querying referenced table with inner join.](#querying-referenced-table-with-inner-join)
    - [Switching schemas per query.](#switching-schemas-per-query)
  </div>
</Details>

```ts
const { data, error } = await supabase
  .from('characters')
  .select()
```

<Details>
  <Summary>Data source</Summary>
  <div><Response /></div>
</Details>

---
## Insert data
Perform an `INSERT` into the table or view.

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `values` | Required | One of the following options: | The values to insert. Pass an object to insert a single row or an array to insert multiple rows. |

<Details>
  <Summary>Details</Summary>
  <div>
    - [Option 1](#option-1)
    - [Option 2](#option-2)
  </div>
</Details>

| `options` | Optional | object | Named parameters. |

<Details>
  <Summary>Details</Summary>
  <div>
    - [Create a record.](#create-a-record)
    - [Create a record and return it.](#create-a-record-and-return-it)
    - [Bulk create.](#bulk-create)
  </div>
</Details>

```ts
const { error } = await supabase
  .from('countries')
  .insert({ id: 1, name: 'Mordor' })
```

<Details>
  <Summary>Data source</Summary>
  <div><Response /></div>
</Details>

---
## Update data
Perform an `UPDATE` on the table or view.

> `update()` should always be combined with [Filters](#using-filters) to target the item(s) you wish to update.

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `values` | Required | Row | The values to update with. |
| `options` | Required | object | Named parameters. |

<Details>
  <Summary>Details</Summary>
  <div>
    - [Updating your data.](#updating-your-data)
    - [Update a record and return it.](#update-a-record-and-return-it)
    - [Updating JSON data.](#updating-json-data)
  </div>
</Details>

```ts
const { error } = await supabase
  .from('instruments')
  .update({ name: 'piano' })
  .eq('id', 1)
```

<Details>
  <Summary>Data source</Summary>
  <div><Response /></div>
</Details>

---
## Upsert data
Perform an `UPSERT` on the table or view. Depending on the column(s) passed to `onConflict`, `.upsert()` allows you to perform the equivalent of `.insert()` if a row with the corresponding `onConflict` columns doesn't exist, or if it does exist, perform an alternative action depending on `ignoreDuplicates`.

> Primary keys must be included in `values` to use `upsert`.

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `values` | Required | One of the following options: | The values to upsert with. Pass an object to upsert a single row or an array to upsert multiple rows. |

<Details>
  <Summary>Details</Summary>
  <div>
    - [Option 1](#option-1)
    - [Option 2](#option-2)
  </div>
</Details>

| `options` | Optional | object | Named parameters. |

<Details>
  <Summary>Details</Summary>
  <div>
    - [Upsert your data.](#upsert-your-data)
    - [Bulk Upsert your data.](#bulk-upsert-your-data)
    - [Upserting into tables with constraints.](#upserting-into-tables-with-constraints)
  </div>
</Details>

```ts
const { data, error } = await supabase
  .from('instruments')
  .upsert({ id: 1, name: 'piano' })
  .select()
```

<Details>
  <Summary>Data source</Summary>
  <div><Response /></div>
</Details>

---
## Delete data
Perform a `DELETE` on the table or view.

- `delete()` should always be combined with filters to target the item(s) you wish to delete.
- If you use `delete()` with filters and you have RLS enabled, only rows visible through `SELECT` policies are deleted. Note that by default no rows are visible, so you need at least one `SELECT/ALL` policy that makes the rows visible.
- When using `delete().in()`, specify an array of values to target multiple rows with a single query. This is particularly useful for batch deleting entries that share common criteria, such as deleting users by their IDs. Ensure that the array you provide accurately represents all records you intend to delete to avoid unintended data removal.

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `options` | Required | object | Named parameters. |

<Details>
  <Summary>Details</Summary>
  <div>
    - [Delete a single record.](#delete-a-single-record)
    - [Delete a record and return it.](#delete-a-record-and-return-it)
    - [Delete multiple records.](#delete-multiple-records)
  </div>
</Details>

```ts
const response = await supabase
  .from('countries')
  .delete()
  .eq('id', 1)
```

<Details>
  <Summary>Data source</Summary>
  <div><Response /></div>
</Details>
```