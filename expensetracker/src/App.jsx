import { useEffect, useState } from 'react'
import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'

import { Authenticator, Button, Flex, Heading, TextField, Text } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

import { generateClient } from 'aws-amplify/data'

const client = generateClient()

Amplify.configure(outputs)

export default function App() {
  const [expenses, setExpenses] = useState([])
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [creating, setCreating] = useState(false)

  async function fetchExpenses() {
    const { data, errors } = await client.models.Expense.list()
    if (errors?.length) {
      console.error('Error fetching expenses:', errors)
      return
    }
    setExpenses(data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')))
  }

  async function createExpense(e) {
    e?.preventDefault?.()
    if (!name.trim() || !amount) return

    setCreating(true)
    try {
      await client.models.Expense.create({
        name: name.trim(),
        amount: parseFloat(amount),
      })

      setName('')
      setAmount('')
      await fetchExpenses()
    } catch (error) {
      console.error('Error creating expense:', error)
    } finally {
      setCreating(false)
    }
  }

  async function deleteExpense(id) {
    try {
      await client.models.Expense.delete({ id })
      await fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '24px' }}>
      <Heading level={2}>Expense Tracker</Heading>

      <Authenticator>
        {({ signOut, user }) => (
          <Flex direction="column" gap="1.25rem" marginTop="1rem">
            <div>Signed in as <strong>{user?.username}</strong></div>

            <form onSubmit={createExpense}>
              <Flex direction="column" gap="0.75rem">
                <TextField
                  label="Expense Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Groceries"
                  required
                />
                <TextField
                  label="Amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <Button type="submit" isDisabled={creating} variation="primary">
                  {creating ? 'Adding...' : 'Add Expense'}
                </Button>
              </Flex>
            </form>

            <div style={{ marginTop: '2rem' }}>
              <Heading level={3}>Your Expenses</Heading>
              {expenses.length === 0 ? (
                <Text>No expenses yet. Add one above!</Text>
              ) : (
                <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'black'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{expense.name}</div>
                        <div>${expense.amount.toFixed(2)}</div>
                      </div>
                      <Button
                        variation="destructive"
                        size="small"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={signOut} variation="link" style={{ marginTop: '2rem' }}>
              Sign out
            </Button>
          </Flex>
        )}
      </Authenticator>
    </div>
  )
}
