import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightTheme, darkTheme } from './fairshare'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'themeMode'

const ThemeContext = createContext<any>({
  mode: 'light' as ThemeMode,
  theme: lightTheme,
  toggle: (mode?: ThemeMode) => {},
})

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const val = await AsyncStorage.getItem(STORAGE_KEY)
        if (!active) return
        if (val === 'dark') setMode('dark')
        else setMode('light')
      } catch {
        // ignore
      }
    }

    load()
    return () => { active = false }
  }, [])

  const toggle = async (next?: ThemeMode) => {
    try {
      const newMode = next || (mode === 'light' ? 'dark' : 'light')
      setMode(newMode)
      await AsyncStorage.setItem(STORAGE_KEY, newMode)
    } catch {
      // ignore
    }
  }

  const theme = mode === 'dark' ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ mode, theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useAppTheme = () => useContext(ThemeContext)

export default ThemeContext
