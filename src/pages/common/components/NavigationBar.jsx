import Cookies from 'js-cookie';
import React, { Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { pageRoutes } from '@/apiRoutes';
import ApiErrorBoundary from '@/pages/common/components/ApiErrorBoundary';
import { logout } from '@/store/auth/authSlice';
import { initCart } from '@/store/cart/cartSlice';

import { Skeleton } from '@/components/ui/skeleton';
import { useModal } from '@/hooks/useModal';
import { CartButton } from './CartButton';
import { ConfirmModal } from './ConfirmModal';
import { LoginButton } from './LoginButton';
import { LogoutButton } from './LogoutButton';

export const NavigationBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isOpen, openModal, closeModal } = useModal();
  const { isLogin, user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  useEffect(() => {
    if (isLogin && user) {
      dispatch(initCart(user.uid));
    }
  }, [isLogin, user, dispatch]);

  const handleLogout = () => {
    openModal();
  };

  const handleConfirmLogout = () => {
    dispatch(logout());
    Cookies.remove('accessToken');
    closeModal();
  };

  const handleClickLogo = () => {
    navigate(pageRoutes.main);
  };

  return (
    <>
      <nav className="fixed top-0 w-full bg-white shadow-md z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1
              className="text-xl font-bold cursor-pointer"
              onClick={handleClickLogo}
            >
              스파르타 마트
            </h1>
            <div className="flex items-center space-x-4">
              {isLogin ? (
                <ApiErrorBoundary>
                  <Suspense fallback={<Skeleton className="w-24 h-8" />}>
                    <CartButton cart={cart} />
                    <LogoutButton data={user} onClick={handleLogout} />
                  </Suspense>
                </ApiErrorBoundary>
              ) : (
                <LoginButton />
              )}
            </div>
          </div>
        </div>
      </nav>
      <ConfirmModal
        title="로그아웃 확인"
        description="로그아웃 하시겠습니까?"
        handleClickDisagree={closeModal}
        handleClickAgree={handleConfirmLogout}
        isModalOpened={isOpen}
      />
    </>
  );
};