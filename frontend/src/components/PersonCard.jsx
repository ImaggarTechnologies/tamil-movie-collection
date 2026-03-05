import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getImageUrl } from '../lib/utils';

const PersonCard = ({ person }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative flex flex-col items-center p-3 sm:p-4 bg-slate-900/30 rounded-2xl glass hover:border-indigo-500/30 transition-all text-center"
        >
            <Link to={`/person/${person.tmdb_id}`} className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4 rounded-full overflow-hidden border-2 border-slate-800 group-hover:border-indigo-500 transition-colors flex items-center justify-center bg-slate-800/50">
                {person.profile_path ? (
                    <img
                        src={getImageUrl(person.profile_path, "w185")}
                        alt={person.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <span className="text-xs font-bold text-slate-500 line-clamp-3 uppercase tracking-tighter leading-tight">
                            {person.name}
                        </span>
                    </div>
                )}
            </Link>

            <Link to={`/person/${person.tmdb_id}`}>
                <h4 className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {person.name}
                </h4>
            </Link>

            {person.character && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    as {person.character}
                </p>
            )}

            {person.known_for_department && !person.character && (
                <p className="text-xs text-slate-500 mt-1">
                    {person.known_for_department}
                </p>
            )}
        </motion.div>
    );
};

export default PersonCard;
