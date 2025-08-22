export type FeatureKey =
  | 'customers.delete' | 'customers.merge' | 'customers.export'
  | 'orders.delete'    | 'orders.edit'     | 'orders.export' | 'orders.import'
  | 'tasks.complete'   | 'tasks.defer'
  | 'interactions.delete' | 'interactions.export'
  | 'users.manage'     | 'audit.view' | 'audit.export';

const matrix: Record<'ADMIN'|'MANAGER'|'STAFF', FeatureKey[]> = {
  ADMIN: ['customers.delete','customers.merge','customers.export','orders.delete','orders.edit','orders.export','orders.import','tasks.complete','tasks.defer','interactions.delete','interactions.export','users.manage','audit.view','audit.export'],
  MANAGER: ['customers.delete','customers.merge','customers.export','orders.edit','orders.export','orders.import','tasks.complete','tasks.defer','interactions.delete','interactions.export','audit.view','audit.export'],
  STAFF: ['orders.edit','tasks.complete','tasks.defer'],
};

export const can = (role: 'ADMIN'|'MANAGER'|'STAFF', key: FeatureKey) => matrix[role]?.includes(key) ?? false;