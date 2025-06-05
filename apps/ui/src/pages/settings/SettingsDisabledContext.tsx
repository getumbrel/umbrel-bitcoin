import {createContext, useContext} from 'react'

export const SettingsDisabledContext = createContext(false)
export const useInputsDisabled = () => useContext(SettingsDisabledContext)
