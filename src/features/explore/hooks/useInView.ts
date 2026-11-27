import { useEffect, useRef, useState } from 'react'

/** True once the element has entered the viewport (and stays true). Falls back to true without IntersectionObserver. */
export const useInView = <T extends Element>() => {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (inView || !node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true)
        observer.disconnect()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView])

  return { ref, inView }
}
