import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { demoActivities, demoBattles, demoInvitations } from '../services/demoData'
import type { Battle, BattlePhase, DemoInvitation, DemoSession, DemoTransaction } from '../types/domain'

type DemoState = {
  session: DemoSession | null
  battles: Battle[]
  battlePhases: Record<string, BattlePhase>
  invitations: DemoInvitation[]
  supportTokens: number
  clashCoins: number
  supportByCreator: Record<string, number>
  votes: Record<string, string>
  followedCreators: string[]
  completedActivities: string[]
  transactions: DemoTransaction[]
  createDemoSession: (name: string, mode?: 'creator' | 'community') => void
  signOut: () => void
  switchMode: (mode: 'creator' | 'community') => void
  createBattle: (battle: Battle) => void
  respondToInvitation: (id: string, response: 'accepted' | 'declined') => void
  castVote: (activityId: string, option: string) => void
  setBattlePhase: (id: string, phase: BattlePhase) => void
  toggleFollow: (creatorId: string) => void
  completeDemoActivity: (id: string) => boolean
  resetDemo: () => void
}

const initialState: Pick<
  DemoState,
  | 'session'
  | 'battles'
  | 'battlePhases'
  | 'invitations'
  | 'supportTokens'
  | 'clashCoins'
  | 'supportByCreator'
  | 'votes'
  | 'followedCreators'
  | 'completedActivities'
  | 'transactions'
> = {
  session: null,
  battles: demoBattles,
  battlePhases: {
    'btl-arc-204': 'live',
    'btl-syn-118': 'waiting',
    'btl-pxl-072': 'completed',
    'btl-tas-351': 'waiting',
    'btl-logic-220': 'live',
  },
  invitations: demoInvitations,
  supportTokens: 480,
  clashCoins: 360,
  supportByCreator: {},
  votes: {},
  followedCreators: [],
  completedActivities: [],
  transactions: [
    {
      id: 'txn-demo-001',
      currency: 'Support Tokens' as const,
      amount: 120,
      kind: 'earned' as const,
      description: 'Demo participation grant',
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
    {
      id: 'txn-demo-002',
      currency: 'Clash Coins' as const,
      amount: 80,
      kind: 'demo grant' as const,
      description: 'Demo creator reward grant',
      createdAt: new Date(Date.now() - 172_800_000).toISOString(),
    },
  ],
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...initialState,
      createDemoSession: (name, mode = 'community') =>
        set({
          session: {
            name: name.trim() || 'Arena Guest',
            handle: '@arena-guest',
            mode,
            createdAt: new Date().toISOString(),
          },
        }),
      signOut: () => set({ session: null }),
      switchMode: (mode) =>
        set((state) => ({
          session: state.session ? { ...state.session, mode } : null,
        })),
      createBattle: (battle) =>
        set((state) => ({ battles: [battle, ...state.battles] })),
      respondToInvitation: (id, response) =>
        set((state) => ({
          invitations: state.invitations.map((invitation) =>
            invitation.id === id ? { ...invitation, status: response } : invitation,
          ),
        })),
      castVote: (activityId, option) =>
        set((state) => ({ votes: { ...state.votes, [activityId]: option } })),
      setBattlePhase: (id, phase) =>
        set((state) => ({ battlePhases: { ...state.battlePhases, [id]: phase } })),
      toggleFollow: (creatorId) =>
        set((state) => ({
          followedCreators: state.followedCreators.includes(creatorId)
            ? state.followedCreators.filter((id) => id !== creatorId)
            : [...state.followedCreators, creatorId],
        })),
      completeDemoActivity: (id) => {
        const state = get()
        if (state.completedActivities.includes(id)) return false
        set({
          completedActivities: [...state.completedActivities, id],
        })
        return true
      },
      resetDemo: () =>
        set({
          ...initialState,
          battles: demoBattles,
        invitations: demoInvitations,
        battlePhases: {
          'btl-arc-204': 'live',
          'btl-syn-118': 'waiting',
          'btl-pxl-072': 'completed',
          'btl-tas-351': 'waiting',
          'btl-logic-220': 'live',
        },
        session: null,
        votes: {},
        followedCreators: [],
        completedActivities: [],
          supportByCreator: {},
        }),
    }),
    {
      name: 'creator-clash-demo-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        battles: state.battles,
        invitations: state.invitations,
        battlePhases: state.battlePhases,
        supportTokens: state.supportTokens,
        clashCoins: state.clashCoins,
        supportByCreator: state.supportByCreator,
        votes: state.votes,
        followedCreators: state.followedCreators,
        completedActivities: state.completedActivities,
        transactions: state.transactions,
      }),
    },
  ),
)

export function getOpenDemoActivities() {
  return demoActivities.filter((activity) => activity.status === 'open')
}
