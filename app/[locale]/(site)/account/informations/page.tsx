import { getTranslations } from 'next-intl/server'
import { asc, desc, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, addresses as addressesTable } from '@/db/schema'
import ProfileModal from '../ProfileModal'
import PasswordModal from '../PasswordModal'
import AddressModal from '../AddressModal'
import { deleteAddress, setDefaultAddress } from '../informationsActions'
import styles from '../account.module.css'

type Props = { params: Promise<{ locale: string }> }

export default async function MyInformationsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('account')
  const session = await auth()
  const userId = session?.user?.id ?? ''

  const [u] = userId
    ? await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          createdAt: users.createdAt,
          emailVerified: users.emailVerified,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    : [undefined]

  const addrs = userId
    ? await db
        .select({
          id: addressesTable.id,
          label: addressesTable.label,
          line1: addressesTable.line1,
          line2: addressesTable.line2,
          postalCode: addressesTable.postalCode,
          city: addressesTable.city,
          country: addressesTable.country,
          phone: addressesTable.phone,
          isDefault: addressesTable.isDefault,
        })
        .from(addressesTable)
        .where(eq(addressesTable.userId, userId))
        .orderBy(desc(addressesTable.isDefault), asc(addressesTable.createdAt))
    : []

  const firstName = u?.firstName ?? ''
  const lastName = u?.lastName ?? ''
  const phone = u?.phone ?? ''
  const memberSince = u?.createdAt
    ? new Date(u.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  const row = (label: string, value: string) => (
    <div className={styles.infoRow}>
      <span className={styles.infoKey}>{label}</span>
      <span className={styles.infoVal}>{value || '—'}</span>
    </div>
  )

  return (
    <div className={styles.infoGrid}>
      {/* ── Left column ── */}
      <div className={styles.infoCol}>
        <section className={styles.infoCard}>
          <div className={styles.infoCardHead}>
            <h2 className={styles.infoCardTitle}>{t('identity')}</h2>
            <ProfileModal
              locale={locale}
              firstName={firstName}
              lastName={lastName}
              phone={phone}
              triggerClassName={styles.cardBtn}
            />
          </div>
          <div className={styles.infoRowsGrid}>
            {row(t('first_name'), firstName)}
            {row(t('last_name'), lastName)}
            {row(t('email_label'), u?.email ?? '')}
            {row(t('phone'), phone)}
          </div>
        </section>

        <section className={styles.infoCard}>
          <div className={styles.infoCardHead}>
            <h2 className={styles.infoCardTitle}>{t('security')}</h2>
          </div>
          <div className={styles.infoRows}>
            <div className={styles.infoRowAction}>
              <div>
                <span className={styles.infoKey}>{t('password')}</span>
                <span className={styles.infoVal}>••••••••••</span>
              </div>
              {u?.passwordHash && <PasswordModal locale={locale} triggerClassName={styles.cardBtn} />}
            </div>
            {row(
              t('member_since'),
              `${memberSince}${u?.emailVerified ? ` · ${t('verified')}` : ''}`
            )}
          </div>
        </section>
      </div>

      {/* ── Right column ── */}
      <div className={styles.infoCol}>
        <section className={styles.infoCard}>
          <div className={styles.infoCardHead}>
            <h2 className={styles.infoCardTitle}>
              {t('addresses')} ({addrs.length})
            </h2>
            <AddressModal locale={locale} triggerClassName={styles.cardBtn} />
          </div>

          {addrs.length === 0 ? (
            <p className={styles.infoEmpty}>{t('no_address')}</p>
          ) : (
            <div className={styles.addrList}>
              {addrs.map((a) => (
                <div key={a.id} className={styles.addrCard}>
                  <div className={styles.addrHead}>
                    <span className={styles.addrLabel}>{a.label || t('address')}</span>
                    {a.isDefault && <span className={styles.addrDefault}>{t('default')}</span>}
                  </div>
                  <p className={styles.addrBody}>
                    {a.line1}
                    {a.line2 ? (
                      <>
                        <br />
                        {a.line2}
                      </>
                    ) : null}
                    <br />
                    {[a.postalCode, a.city].filter(Boolean).join(' ')}
                    <br />
                    {a.country}
                  </p>
                  <div className={styles.addrActions}>
                    <AddressModal locale={locale} address={a} triggerClassName={styles.cardBtn} />
                    {!a.isDefault && (
                      <form action={setDefaultAddress}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className={styles.cardBtn}>
                          {t('set_default')}
                        </button>
                      </form>
                    )}
                    <form action={deleteAddress}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className={styles.cardBtnDanger}>
                        {t('delete')}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
