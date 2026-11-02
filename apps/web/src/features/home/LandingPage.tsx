import { ArrowDown, ArrowRight, ArrowUpRight, Sparkles, Trophy, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { BattleCard } from '../../components/data/BattleCard'
import { ImmersiveScene } from '../../components/scenes/ImmersiveScene'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { creatorCategories, demoBattles } from '../../services/demoData'
import { useEffect, useRef, type CSSProperties } from 'react'
import { demoCreators } from '../../services/demoData'
import { useMotionPreference } from '../../utils/motionPreference'

export function LandingPage() {
  const reduceMotion = useMotionPreference()
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero || reduceMotion || window.matchMedia('(max-width: 760px)').matches) return

    let frame = 0
    const onPointerMove = (event: PointerEvent) => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect()
        hero.style.setProperty('--pointer-x', String((event.clientX - bounds.left) / bounds.width - 0.5))
        hero.style.setProperty('--pointer-y', String((event.clientY - bounds.top) / bounds.height - 0.5))
      })
    }
    const reset = () => {
      hero.style.setProperty('--pointer-x', '0')
      hero.style.setProperty('--pointer-y', '0')
    }
    hero.addEventListener('pointermove', onPointerMove, { passive: true })
    hero.addEventListener('pointerleave', reset, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      hero.removeEventListener('pointermove', onPointerMove)
      hero.removeEventListener('pointerleave', reset)
    }
  }, [reduceMotion])

  return (
    <>
      <section aria-labelledby="hero-title" className="hero-section" ref={heroRef}>
        <div aria-hidden="true" className="hero-visual">
          <img alt="" fetchPriority="high" src="/art/samurai-arena.jpg" />
        </div>
        <div aria-hidden="true" className="hero-atmosphere">
          <span className="hero-mist hero-mist-one" />
          <span className="hero-mist hero-mist-two" />
          <span className="sakura-petal petal-one" />
          <span className="sakura-petal petal-two" />
          <span className="sakura-petal petal-three" />
          <span className="sakura-petal petal-four" />
          <span className="sakura-petal petal-five" />
        </div>
        <div className="hero-copy">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="hero-content"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }
            }
          >
            <p className="eyebrow hero-eyebrow">
              <span aria-hidden="true" className="eyebrow-rule" />
              CREATOR CLASH · THE LIVING ARENA
            </p>
            <h1 id="hero-title">
              Your Community.
              <br />
              Your Competition.
              <br />
              <span className="headline-accent">Your Victory.</span>
            </h1>
            <p className="hero-description">
              Where creators become warriors, communities become clans, and every
              competition writes a new legend.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/arena">
                Enter the Arena <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
              <Link className="button button-secondary" to="/signup?mode=creator">
                Become a Creator
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </motion.div>
        </div>

        <a className="scroll-cue" href="#experiences">
          <ArrowDown aria-hidden="true" size={15} />
          <span>Discover Creator Clash</span>
        </a>
      </section>

      <section aria-label="Creator Clash product promise" className="promise-band">
        <span>BUILT AROUND THE PEOPLE WHO MAKE IT MATTER</span>
        <span className="promise-divider" />
        <span>MADE FOR TWITCH CREATORS</span>
        <span className="promise-divider" />
        <span>CONNECTED THROUGH COMPETITION</span>
      </section>

      <section aria-labelledby="categories-title" className="categories-section">
        <div className="categories-intro">
          <p className="eyebrow">CREATOR CLASH IS FOR EVERY KIND OF CREATOR</p>
          <h2 id="categories-title">A stage for what<br />you love to make.</h2>
          <p>Not every competition needs a controller. Bring your craft, your point of view, and the people who make it matter.</p>
        </div>
        <div aria-label="Creator categories" className="category-list">
          {creatorCategories.map((category, index) => (
            <Link className="category-link" key={category} to={'/creators?category=' + encodeURIComponent(category)}>
              <span className="category-index">{String(index + 1).padStart(2, '0')}</span>
              <span>{category}</span>
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          ))}
        </div>
        <DemoBadge>{creatorCategories.length + ' CREATOR CATEGORIES'}</DemoBadge>
      </section>

      <section aria-labelledby="featured-title" className="featured-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">FROM THE ARENA · DEMO</p>
            <h2 id="featured-title">Competition brings us closer.</h2>
          </div>
          <Link className="text-action" to="/arena">Explore all <ArrowRight size={16} /></Link>
        </div>
        <div className="featured-battle-list">
          {demoBattles.filter((battle) => battle.featured).map((battle) => (
            <BattleCard battle={battle} key={battle.id} publicView />
          ))}
        </div>
        <p className="foundation-disclosure">
          Featured competitions, timings, and scores are sample content—not live events.
        </p>
      </section>

      <section aria-labelledby="creator-clans-title" className="creator-clans-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">WARRIORS OF EVERY DISCIPLINE</p>
            <h2 id="creator-clans-title">Meet the creators shaping the arena.</h2>
          </div>
          <Link className="text-action" to="/creators">Discover creators <ArrowRight size={16} /></Link>
        </div>
        <div className="creator-clan-list">
          {demoCreators.slice(0, 4).map((creator, index) => (
            <Link className="creator-clan" key={creator.id} to={'/creators/' + creator.id}>
              <span aria-hidden="true" className="creator-clan-rank">0{index + 1}</span>
              <span className="creator-clan-avatar" style={{ '--creator-color': creator.color } as CSSProperties}>{creator.initials}</span>
              <span className="creator-clan-copy"><strong>{creator.name}</strong><small>{creator.category} · {creator.wins} victories</small></span>
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          ))}
        </div>
        <p className="foundation-disclosure">Creator profiles and records shown here are sample content from the browser demo.</p>
      </section>

      <section aria-labelledby="monthly-title" className="monthly-section">
        <div className="monthly-copy">
          <p className="eyebrow"><Trophy aria-hidden="true" size={15} /> THE MONTHLY CHAMPIONSHIP · DEMO</p>
          <h2 id="monthly-title">A whole month<br />to show up for each other.</h2>
          <p>Three daily rounds bring creators and their communities together. Popularity support and skill competition remain distinct.</p>
          <Link className="text-action" to="/championship">
            Discover the championship <ArrowRight size={16} />
          </Link>
        </div>
        <div aria-hidden="true" className="monthly-art">
          <ImmersiveScene kind="trophy" />
          <span className="monthly-art-index">THE MONTHLY<br />POPULARITY CHAMPIONSHIP</span>
          <span className="monthly-art-ring" />
        </div>
      </section>

      <section aria-labelledby="journey-title" className="journey-section">
        <div className="journey-heading">
          <p className="eyebrow">A SIMPLE WAY INTO THE ACTION</p>
          <h2 id="journey-title">Create. Compete. Celebrate.</h2>
          <p>One clear brief brings creators and their communities into the same moment.</p>
        </div>
        <ol className="journey-steps">
          <li><span>01</span><strong>Create</strong><small>Choose the people, category, and challenge that fit your community.</small></li>
          <li><span>02</span><strong>Compete</strong><small>Bring the competition to life on stream and invite the audience in.</small></li>
          <li><span>03</span><strong>Celebrate</strong><small>Share results, recognize participation, and keep community Support Tokens distinct from creator Clash Coins.</small></li>
        </ol>
        <DemoBadge>DESIGNED TO BE EASY TO FOLLOW</DemoBadge>
      </section>

      <section aria-label="The arena experience" className="arena-pillars">
        <article className="arena-pillar">
          <span className="arena-pillar-index">01 · CREATOR STUDIO</span>
          <Sparkles aria-hidden="true" size={18} />
          <h2>Make the challenge yours.</h2>
          <p>Shape a competition brief with creator-led challenge tools. AI suggestions are available only when the service is configured.</p>
          <Link className="text-action" to="/creator/ai-director">Open Challenge Studio <ArrowRight size={15} /></Link>
        </article>
        <article className="arena-pillar">
          <span className="arena-pillar-index">02 · THE COMMUNITY</span>
          <UsersRound aria-hidden="true" size={18} />
          <h2>Be part of the moment.</h2>
          <p>Explore community activities and see how participation can bring a creator’s audience into a competition.</p>
          <Link className="text-action" to="/community/activities">Explore activities <ArrowRight size={15} /></Link>
        </article>
        <article className="arena-pillar">
          <span className="arena-pillar-index">03 · REWARDS</span>
          <Trophy aria-hidden="true" size={18} />
          <h2>Celebrate your style.</h2>
          <p>Preview creator cosmetics and progression. Support Tokens and Clash Coins remain separate currencies.</p>
          <Link className="text-action" to="/creator/rewards">See creator rewards <ArrowRight size={15} /></Link>
        </article>
      </section>

      <section
        aria-labelledby="experiences-title"
        className="experience-section"
        id="experiences"
      >
        <div className="section-heading">
          <p className="eyebrow">ONE ARENA · TWO PERSPECTIVES</p>
          <h2 id="experiences-title">Built for the people who make it matter.</h2>
        </div>
        <p className="experience-intro">Creators and community members use the same account. Follow creators, join activities, and support the people you care about—without confusing community Support Tokens with creator Clash Coins.</p>
        <div className="experience-links">
          <Link className="experience-link" to="/creator">
            <span className="experience-index">01</span>
            <span className="experience-link-copy">
              <span className="experience-title">For creators</span>
              <span className="experience-description">
                A dedicated space for the people who bring a competition to life.
              </span>
            </span>
            <ArrowUpRight aria-hidden="true" className="experience-arrow" size={19} />
          </Link>
          <Link className="experience-link" to="/community">
            <span className="experience-index">02</span>
            <span className="experience-link-copy">
              <span className="experience-title">For the community</span>
          <span className="experience-description">
                Follow creators, join activities, and take part in the moments you care about.
              </span>
            </span>
            <ArrowUpRight aria-hidden="true" className="experience-arrow" size={19} />
          </Link>
        </div>
        <p className="foundation-disclosure">
          Explore browser-local demo workspaces. Sign-in is a local demo profile;
          production authentication, rewards, and Twitch are not connected.
        </p>
      </section>
      <section className="final-invitation">
        <p className="eyebrow">THE ARENA IS OPEN</p>
        <h2>Bring your people.<br /><span>Make it a competition.</span></h2>
        <p>Explore competitions, meet creators, and find your place in the arena.</p>
        <Link className="button button-primary" to="/arena">
          Explore the Arena <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  )
}
