export default function UserAvatar({ nickname, src, className = 'w-8 h-8' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={nickname}
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${className} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: `hsl(${(nickname?.charCodeAt(0) ?? 0) * 37 % 360}, 60%, 50%)` }}
    >
      {nickname?.[0]?.toUpperCase()}
    </div>
  )
}
