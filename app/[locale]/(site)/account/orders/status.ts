import styles from '../account.module.css'

// Order status → badge variant class (shared by the list and the detail view).
export const ORDER_STATUS_CLASS: Record<string, string> = {
  pending_payment: styles.stWarn,
  paid: styles.stOk,
  preparing: styles.stMuted,
  shipped: styles.stInfo,
  delivered: styles.stOk,
  cancelled: styles.stBad,
  refunded: styles.stBad,
}
