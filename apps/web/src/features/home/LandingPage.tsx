import { ArrowDown, ArrowRight, ArrowUpRight, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { BattleCard } from '../../components/data/BattleCard'
import { ImmersiveScene } from '../../components/scenes/ImmersiveScene'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { creatorCategories, demoBattles } from '../../services/demoData'
import { useMotionPreference } from '../../utils/motionPreference'

export function LandingPage() {
  const reduceMotion = useMotionPreference()

  return (
    <>
      <section aria-labelledby="hero-title" className="hero-section">
        <div aria-hidden="true" className="hero-orbit hero-orbit-outer" />
        <div aria-hidden="true" className="hero-orbit hero-orbit-inner" />
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
              CREATOR CLASH · A SHARED ARENA FOR EVERY CREATOR
            </p>
            <h1 id="hero-title">
              Your Community.
              <br />
              Your Competition.
              <br />
              <span className="headline-accent">Your Victory.</span>
            </h1>
            <p className="hero-description">
              Creator Clash brings creators and their communities together through
              challenges, competitions, and shared experiences.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/arena">
                Explore the Arena <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
              <Link className="button button-secondary" to="/signup?mode=creator">
                Become a Creator
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </motion.div>
        </div>

        <div aria-hidden="true" className="arena-composition">
          <ImmersiveScene kind="arena" />
          <div aria-hidden="true" className="arena-halo" />
          <div aria-hidden="true" className="arena-rail arena-rail-top" />
          <div aria-hidden="true" className="arena-rail arena-rail-bottom" />
          <div aria-hidden="true" className="arena-axis" />
          <div aria-hidden="true" className="arena-corner arena-corner-one" />
          <div aria-hidden="true" className="arena-corner arena-corner-two" />
          <div className="arena-monogram">
            <span className="monogram-c">C</span>
            <span className="monogram-c monogram-second">C</span>
            <span className="monogram-caption">THE ARENA IS YOURS</span>
          </div>
          <span aria-hidden="true" className="arena-index arena-index-top">
            01 <span>·</span> CREATOR
          </span>
          <span aria-hidden="true" className="arena-index arena-index-bottom">
            COMMUNITY <span>·</span> 02
          </span>
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
