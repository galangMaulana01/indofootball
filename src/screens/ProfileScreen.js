import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Svg, Path } from 'react-native-svg';

export default function ProfileScreen({ user, onLogout }) {
  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';
  const name = user?.displayName || 'User';
  const email = user?.email || '-';

  return (
    <ScrollView className="flex-1 w-full mb-20" showsVerticalScrollIndicator={false}>

      {/* Avatar section */}
      <View className="items-center pt-10 pb-8 px-6">
        <View className="w-24 h-24 rounded-full bg-merah items-center justify-center mb-4">
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} className="w-full h-full rounded-full" resizeMode="cover" />
          ) : (
            <Text className="text-white font-black text-4xl">{initial}</Text>
          )}
        </View>
        <Text className="text-white font-black text-xl">{name}</Text>
        <Text className="text-gray-400 text-sm mt-1">{email}</Text>
      </View>

      {/* Info card */}
      <View className="mx-4 mb-4 bg-culos rounded-xl overflow-hidden">
        {/* Nama */}
        <View className="flex-row items-center px-4 py-4 border-b border-white/5">
          <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center mr-3">
            <Svg width={18} height={18} fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <Path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </Svg>
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Nama</Text>
            <Text className="text-sm font-semibold text-white">{name}</Text>
          </View>
        </View>

        {/* Email */}
        <View className="flex-row items-center px-4 py-4">
          <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center mr-3">
            <Svg width={18} height={18} fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <Path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </Svg>
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Email</Text>
            <Text className="text-sm font-semibold text-white">{email}</Text>
          </View>
        </View>
      </View>

      {/* Logout button */}
      <View className="mx-4">
        <TouchableOpacity
          onPress={onLogout}
        >
          <Text className="text-white hover:text-red-600 transition-color font-black text-sm tracking-wider">Keluar</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}
