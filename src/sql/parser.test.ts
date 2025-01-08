import { describe, beforeEach, it, expect } from '@jest/globals'

import { SQLContextTransformer, TransformationConfig } from './parser';

describe('SQLContextTransformer', () => {
  let transformer: SQLContextTransformer;

  beforeEach(() => {
    const config: TransformationConfig = {
      excludedTables: new Set(['metadata']),
      customTransforms: {
        'special': (contextId: string) => `${contextId}_special_${new Date().getFullYear()}`
      }
    };
    transformer = new SQLContextTransformer(config);
  });

  const normalizeSQL = (sql: string): string => {
    return sql.replace(/\s+/g, ' ').trim();
  };

  describe('Basic Transformations', () => {
    it('should transform simple SELECT queries', () => {
      const input = 'SELECT * FROM users';
      const expected = 'SELECT * FROM `ctx1_users`';
      expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
        .toBe(normalizeSQL(expected));
    });

    it('should not transform excluded tables', () => {
      const input = 'SELECT * FROM metadata';
      const expected = 'SELECT * FROM `metadata`';
      expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
        .toBe(normalizeSQL(expected));
    });

    it('should apply custom transformations', () => {
      const input = 'SELECT * FROM special';
      const expected = `SELECT * FROM \`ctx1_special_${new Date().getFullYear()}\``;
      expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
        .toBe(normalizeSQL(expected));
    });
  });

  describe('Complex Queries - CTEs', () => {
    it('should handle single CTE', () => {
      const input = `
        WITH recurring_users AS (
          SELECT user_id, COUNT(*) as visits 
          FROM visits 
          GROUP BY user_id
          HAVING COUNT(*) > 5
        )
        SELECT * FROM recurring_users
        JOIN users ON users.id = recurring_users.user_id
      `;
      const expected = `
        WITH \`recurring_users\` AS
        (SELECT \`user_id\`, COUNT(*) AS \`visits\`
        FROM \`ctx1_visits\`
        GROUP BY \`user_id\`
        HAVING COUNT(*) > 5)
        SELECT * FROM \`recurring_users\`
        JOIN \`ctx1_users\` ON \`ctx1_users\`.\`id\` = \`recurring_users\`.\`user_id\`
      `;
      expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
        .toBe(normalizeSQL(expected));
    });

//     it('should handle multiple CTEs', () => {
//       const input = `
//         WITH recurring_users AS (
//           SELECT user_id FROM visits
//         ),
//         high_value_users AS (
//           SELECT * FROM users
//           JOIN recurring_users ON users.id = recurring_users.user_id
//         )
//         SELECT * FROM high_value_users
//       `;
//       const expected = `
//         WITH recurring_users AS (
//           SELECT user_id FROM ctx1_visits
//         ),
//         high_value_users AS (
//           SELECT * FROM ctx1_users
//           JOIN recurring_users ON ctx1_users.id = recurring_users.user_id
//         )
//         SELECT * FROM high_value_users
//       `;
//       expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
//         .toBe(normalizeSQL(expected));
//     });
//   });

//   describe('Complex Queries - UNIONs', () => {
//     it('should handle UNION with subqueries', () => {
//       const input = `
//         SELECT * FROM active_users 
//         WHERE region = 'NA'
//         UNION ALL
//         SELECT * FROM (
//           SELECT * FROM archived_users
//           WHERE deactivation_date > '2023-01-01'
//         )
//         UNION ALL
//         SELECT * FROM metadata
//       `;
//       const expected = `
//         SELECT * FROM ctx1_active_users 
//         WHERE region = 'NA'
//         UNION ALL
//         SELECT * FROM (
//           SELECT * FROM ctx1_archived_users
//           WHERE deactivation_date > '2023-01-01'
//         )
//         UNION ALL
//         SELECT * FROM metadata
//       `;
//       expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
//         .toBe(normalizeSQL(expected));
//     });
//   });

//   describe('Complex Queries - Joins and Subqueries', () => {
//     it('should handle complex joins with subqueries', () => {
//       const input = `
//         SELECT 
//           u.name,
//           (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count
//         FROM users u
//         LEFT JOIN profiles p ON u.id = p.user_id
//         JOIN (
//           SELECT user_id, COUNT(*) as login_count 
//           FROM login_history 
//           GROUP BY user_id
//         ) lh ON u.id = lh.user_id
//       `;
//       const expected = `
//         SELECT 
//           u.name,
//           (SELECT COUNT(*) FROM ctx1_orders o WHERE o.user_id = u.id) as order_count
//         FROM ctx1_users u
//         LEFT JOIN ctx1_profiles p ON u.id = p.user_id
//         JOIN (
//           SELECT user_id, COUNT(*) as login_count 
//           FROM ctx1_login_history 
//           GROUP BY user_id
//         ) lh ON u.id = lh.user_id
//       `;
//       expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
//         .toBe(normalizeSQL(expected));
//     });

//     it('should handle EXISTS subqueries', () => {
//       const input = `
//         SELECT * FROM users u
//         WHERE EXISTS (
//           SELECT 1 FROM orders
//           WHERE orders.user_id = u.id
//         )
//       `;
//       const expected = `
//         SELECT * FROM ctx1_users u
//         WHERE EXISTS (
//           SELECT 1 FROM ctx1_orders
//           WHERE ctx1_orders.user_id = u.id
//         )
//       `;
//       expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
//         .toBe(normalizeSQL(expected));
//     });
//   });

//   describe('Edge Cases', () => {
//     it('should handle empty queries', () => {
//       expect(() => transformer.transformQuery('', 'ctx1')).toThrow();
//     });

//     it('should handle invalid SQL', () => {
//       expect(() => transformer.transformQuery('SELECT * FREM users', 'ctx1')).toThrow();
//     });

//     it('should handle queries with no tables', () => {
//       const input = 'SELECT 1 + 1';
//       const expected = 'SELECT 1 + 1';
//       expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
//         .toBe(normalizeSQL(expected));
//     });

//     it('should handle case sensitivity correctly', () => {
//       const input = 'SELECT * FROM Users JOIN METADATA on Users.id = METADATA.user_id';
//       const expected = 'SELECT * FROM ctx1_Users JOIN METADATA on ctx1_Users.id = METADATA.user_id';
//       expect(normalizeSQL(transformer.transformQuery(input, 'ctx1')))
//         .toBe(normalizeSQL(expected));
//     });
  });
});