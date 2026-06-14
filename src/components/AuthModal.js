import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { Svg, Path } from 'react-native-svg';

export default function AuthModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
      await signInWithCredential(auth, credential);
      onClose();
    } catch (error) {
      setErrorMsg('Gagal masuk dengan Google.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-[#353535] rounded-2xl shadow-2xl w-full max-w-sm p-6 items-center">
          <Image source={require('../../assets/logo.png')} className="w-14 h-14 mb-4" resizeMode="contain" />
          <Text className="text-lg font-black text-white mb-1">Selamat Datang di IndoScore</Text>
          <Text className="text-xs text-gray-400 mb-6">Masuk untuk pengalaman yang lebih personal</Text>

          <TouchableOpacity 
            onPress={handleLogin} 
            disabled={loading}
            className="w-full flex-row items-center justify-center gap-3 bg-white px-4 py-3 rounded-xl mb-3"
          >
            {loading ? <ActivityIndicator color="#000" /> : (
              <>
                <Svg width="20" height="20" viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </Svg>
                <Text className="text-gray-800 font-semibold">Masuk / Daftar dengan Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="w-full py-2.5 px-4 items-center">
            <Text className="text-gray-400 text-sm font-medium">Nanti Saja</Text>
          </TouchableOpacity>

          {errorMsg !== '' && (
            <View className="mt-4 bg-red-400/10 border border-red-400/20 rounded-lg p-2 w-full">
              <Text className="text-xs text-red-400 text-center">{errorMsg}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
