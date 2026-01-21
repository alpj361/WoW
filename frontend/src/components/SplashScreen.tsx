import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const videoRef = useRef<Video>(null);

    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.unloadAsync();
            }
        };
    }, []);

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish && !status.isLooping) {
            onFinish?.();
        }
    };

    // Calculate video dimensions to fit width while maintaining aspect ratio
    const videoAspectRatio = 16 / 9; // Assuming horizontal video
    const videoHeight = width / videoAspectRatio;

    return (
        <View style={styles.container}>
            <Video
                ref={videoRef}
                source={require('../../assets/splash-video.mp4')}
                style={[styles.video, { height: videoHeight }]}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
                isMuted
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: width,
    },
});
