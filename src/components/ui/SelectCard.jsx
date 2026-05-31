import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAppTheme } from '../../hooks/useAppTheme.js';

export default function SelectCard({ selected, title, description, meta, onClick }) {
  const { tokens, sx } = useAppTheme();

  return (
    <Card sx={sx.selectCard(selected)} elevation={0}>
      <CardActionArea onClick={onClick} sx={{ cursor: 'pointer', p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: selected ? tokens.color.baize.main : tokens.color.bg.elevated,
              border: `1px solid ${selected ? tokens.color.baize.light : tokens.color.border.default}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: selected ? tokens.shadow.glow : 'none',
              transition: 'all 250ms',
            }}
          >
            {selected ? (
              <CheckCircleIcon sx={{ color: '#fff', fontSize: 22 }} />
            ) : (
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.color.text.muted }} />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontFamily: tokens.font.heading, fontWeight: 700, mb: 0.25 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45, fontSize: '0.875rem' }}>
              {description}
            </Typography>
            {meta && (
              <Typography variant="caption" sx={{ mt: 0.75, display: 'block', color: tokens.color.gold.main, fontWeight: 600 }}>
                {meta}
              </Typography>
            )}
          </Box>
          <ChevronRightIcon sx={{ color: tokens.color.text.muted, flexShrink: 0 }} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
