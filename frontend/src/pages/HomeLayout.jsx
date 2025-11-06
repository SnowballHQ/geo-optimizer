import React, { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { navigationService } from '../utils/navigationService'

const HomeLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Register navigation service for use in non-React modules (like api.js)
  useEffect(() => {
    navigationService.setNavigate(navigate, location)
  }, [navigate, location])

  return (
    <Outlet />
  )
}

export default HomeLayout