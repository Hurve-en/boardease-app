import { Image } from "expo-image";

type Props = { size?: number };

const ASPECT = 469 / 493;

export default function LogoMark({ size = 36 }: Props) {
  return (
    <Image
      source={require("@/assets/brand/boardease-mark.png")}
      style={{ width: size, height: size * ASPECT }}
      contentFit="contain"
      accessible={false}
      alt=""
    />
  );
}
