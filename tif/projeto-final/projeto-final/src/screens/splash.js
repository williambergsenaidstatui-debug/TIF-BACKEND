import { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

const title = 'VERIFY SYSTEM';

function MarkSymbol() {
    return (
      <Svg width="122" height="92" viewBox="0 0 122 92">
        <Path
          d="M33 37 C45 21 70 18 113 0 C93 26 69 35 33 37 Z"
          fill="#9c0712"
        />
        <Path
          d="M18 62 C32 45 63 43 109 22 C87 48 55 57 18 62 Z"
          fill="#9c0712"
        />
        <Path
          d="M0 92 C18 70 55 69 93 54 C73 77 37 82 0 92 Z"
          fill="#9c0712"
        />
      </Svg>
    );
}

export default function Splash({ onFinish }) {
    const { width, height } = useWindowDimensions();
    const markOpacity = useRef(new Animated.Value(0)).current;
    const markScale = useRef(new Animated.Value(0.38)).current;
    const markTranslateX = useRef(new Animated.Value(-70)).current;
    const contentScale = useRef(new Animated.Value(0.94)).current;
    const contentTranslateY = useRef(new Animated.Value(12)).current;
    const letterAnimations = useRef(
        title.split('').map(() => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(14),
        })),
    ).current;
    const scannerOpacity = useRef(new Animated.Value(0)).current;
    const scannerRotate = useRef(new Animated.Value(0)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0.55)).current;
    const contentOpacity = useRef(new Animated.Value(1)).current;
    const finalFade = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const scannerLoop = Animated.loop(
            Animated.timing(scannerRotate, {
                toValue: 1,
                duration: 5200,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );

        scannerLoop.start();

        const letterEntrance = letterAnimations.map(({ opacity, translateY }) => (
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 260,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ])
        ));

        const letterExit = [...letterAnimations].reverse().map(({ opacity, translateY }) => (
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 170,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -10,
                    duration: 190,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
            ])
        ));

        const entrance = Animated.sequence([
            Animated.delay(450),
            Animated.parallel([
                Animated.timing(markOpacity, {
                    toValue: 1,
                    duration: 520,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(markScale, {
                    toValue: 1,
                    duration: 780,
                    easing: Easing.out(Easing.back(1.25)),
                    useNativeDriver: true,
                }),
                Animated.timing(markTranslateX, {
                    toValue: 0,
                    duration: 760,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(contentScale, {
                    toValue: 1,
                    duration: 780,
                    easing: Easing.out(Easing.back(1.1)),
                    useNativeDriver: true,
                }),
                Animated.timing(contentTranslateY, {
                    toValue: 0,
                    duration: 720,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.stagger(38, letterEntrance),
            ]),
            Animated.timing(scannerOpacity, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.delay(950),
            Animated.parallel([
                Animated.timing(ringOpacity, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(ringScale, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(360),
                    Animated.timing(scannerOpacity, {
                        toValue: 0,
                        duration: 360,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]),
            ]),
            Animated.delay(650),
            Animated.parallel([
                Animated.stagger(28, letterExit),
                Animated.timing(contentOpacity, {
                    toValue: 0,
                    duration: 620,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(markScale, {
                    toValue: 0.72,
                    duration: 520,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(contentTranslateY, {
                    toValue: -16,
                    duration: 520,
                    easing: Easing.inOut(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(ringScale, {
                    toValue: 1.18,
                    duration: 520,
                    easing: Easing.inOut(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(550),
            Animated.timing(finalFade, {
                toValue: 0,
                duration: 360,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
        ]);
        entrance.start();

        const timer = setTimeout(() => {
            onFinish();
        }, 5200);

        return () => {
            scannerLoop.stop();
            entrance.stop();
            clearTimeout(timer);
        };
    }, [
        contentOpacity,
        contentScale,
        contentTranslateY,
        finalFade,
        letterAnimations,
        markOpacity,
        markScale,
        markTranslateX,
        onFinish,
        ringOpacity,
        ringScale,
        scannerOpacity,
        scannerRotate,
    ]);

    const rotate = scannerRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    const stageScale = Math.min(Math.max(Math.min(width / 390, height / 760), 0.82), 1.08);

    return (
      <Animated.View testID="splash-screen" style={[styles.container, { opacity: finalFade }]}>
        <View style={[styles.stage, { transform: [{ scale: stageScale }] }]}>
          <Animated.View
            style={[
                styles.scanner,
                {
                    opacity: scannerOpacity,
                    transform: [{ rotate }],
                },
            ]}
          >
            <Svg width="224" height="224" viewBox="0 0 224 224">
              <G opacity="0.55">
                <Circle cx="112" cy="112" r="82" stroke="#263038" strokeWidth="1" fill="none" />
                <Circle cx="112" cy="112" r="108" stroke="#171f26" strokeWidth="1" fill="none" />
                <Path d="M112 4 A108 108 0 0 1 205 58" stroke="#4b5560" strokeWidth="1.4" fill="none" />
                <Path d="M32 74 A94 94 0 0 1 86 22" stroke="#4b5560" strokeWidth="1.4" fill="none" />
                <Path d="M199 151 A96 96 0 0 1 128 219" stroke="#4b5560" strokeWidth="1.4" fill="none" />
                <Path d="M58 207 A104 104 0 0 1 6 118" stroke="#4b5560" strokeWidth="1.4" fill="none" />
              </G>
              <G opacity="0.45">
                <Path d="M112 4 L112 30" stroke="#59636b" strokeWidth="1" />
                <Path d="M220 112 L194 112" stroke="#59636b" strokeWidth="1" />
                <Path d="M112 220 L112 194" stroke="#59636b" strokeWidth="1" />
                <Path d="M4 112 L30 112" stroke="#59636b" strokeWidth="1" />
              </G>
            </Svg>
          </Animated.View>

          <Animated.View
            style={[
                styles.neonRing,
                {
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }],
                },
            ]}
          />
          <Animated.View
            style={[
                styles.neonRingSoft,
                {
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }],
                },
            ]}
          />

          <Animated.View
            style={[
                styles.content,
                {
                    opacity: contentOpacity,
                    transform: [
                        { translateY: contentTranslateY },
                        { scale: contentScale },
                    ],
                },
            ]}
          >
            <Animated.View
              style={[
                  styles.logoWrap,
                  {
                      opacity: markOpacity,
                      transform: [
                          { translateX: markTranslateX },
                          { scale: markScale },
                      ],
                  },
            ]}
          >
              <MarkSymbol />
            </Animated.View>

            <View style={styles.titleRow}>
              {title.split('').map((letter, index) => (
                <Animated.Text
                  key={`${letter}-${index}`}
                  style={[
                      styles.title,
                      letter === ' ' && styles.titleSpace,
                      {
                          opacity: letterAnimations[index].opacity,
                          transform: [
                              { translateY: letterAnimations[index].translateY },
                          ],
                      },
                  ]}
                >
                  {letter}
                </Animated.Text>
              ))}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 32,
    },
    stage: {
        width: 320,
        height: 320,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanner: {
        position: 'absolute',
        top: 48,
        left: 48,
        width: 224,
        height: 224,
    },
    neonRing: {
        position: 'absolute',
        top: 48,
        left: 48,
        width: 224,
        height: 224,
        borderRadius: 112,
        borderWidth: 5,
        borderColor: '#ff143f',
        shadowColor: '#ff143f',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 24,
    },
    neonRingSoft: {
        position: 'absolute',
        top: 34,
        left: 34,
        width: 252,
        height: 252,
        borderRadius: 126,
        borderWidth: 12,
        borderColor: '#760012',
        opacity: 0.35,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12,
    },
    logoWrap: {
        width: 112,
        height: 86,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#9c0712',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        textShadowColor: '#4d0008',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
    },
    titleSpace: {
        width: 8,
    },
});
